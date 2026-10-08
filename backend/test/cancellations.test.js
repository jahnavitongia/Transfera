const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
process.env.JWT_SECRET = "cancellation-test-secret-only";
const app = require("../app");
const User = require("../models/user"), Student = require("../models/student"), Transfer = require("../models/Transfer"), Cancellation = require("../models/Cancellation");
let server, base, tokens = {}, id;
const database = "transfera_cancellations_test";
const profile = { phone: "9000000001", dateOfBirth: "2005-04-12", previousStudentId: "OLD-1", previousInstitution: "Sample College A", previousProgram: "BCA", admissionYear: 2025 };
const body = { reasonCategory: "Personal circumstances", reason: "Fictional test: relocation", acknowledged: true };
const transferBody = { currentProgram: "BCA", destinationSemester: 3, transferReason: "Relocation", previousSubjects: [{ code: "OLD101", name: "Programming Fundamentals", credits: 4, gradePoint: 8 }], transcript: { fileName: "sample.txt", mimeType: "text/plain", content: Buffer.from("FICTIONAL TEST").toString("base64") } };
const call = async (route, method = "GET", data, role = "student") => {
  const response = await fetch(base + route, { method, headers: { "Content-Type": "application/json", ...(tokens[role] ? { Authorization: `Bearer ${tokens[role]}` } : {}) }, body: data ? JSON.stringify(data) : undefined });
  return { status: response.status, body: await response.json() };
};
before(async () => {
  await mongoose.connect(`mongodb://127.0.0.1:27018/${database}`);
  await Promise.all([User.init(), Student.init(), Transfer.init(), Cancellation.init()]);
  const password = await bcrypt.hash("TestPassword123!", 4);
  for (const role of ["student", "other", "switched", "race", "staff", "admin"]) await User.create({ name: role, email: `${role}@example.test`, password, role: ["staff", "admin"].includes(role) ? role : "student" });
  server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve)); base = `http://127.0.0.1:${server.address().port}/api`;
  for (const role of ["student", "other", "switched", "race", "staff", "admin"]) {
    const result = await call("/auth/login", "POST", { email: `${role}@example.test`, password: "TestPassword123!" }, "anonymous"); tokens[role] = result.body.token;
  }
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1) { assert.equal(mongoose.connection.name, database); await mongoose.connection.dropDatabase(); }
  await mongoose.disconnect();
});
test("student must complete own profile, reason and acknowledgement", async () => {
  assert.equal((await call("/cancellations")).status, 200);
  assert.equal((await call("/cancellations", "GET", undefined, "anonymous")).status, 401);
  assert.equal((await call("/cancellations", "POST", body)).status, 400);
  for (const role of ["student", "other", "switched", "race"]) assert.equal((await call("/profile", "PUT", profile, role)).status, 200);
  const changed = await call("/profile", "PUT", { ...profile, previousProgram: "BSc Computer Science" }, "other");
  assert.equal(changed.status, 200); assert.equal(changed.body.student.currentProgram, "BSc Computer Science");
  assert.equal((await call("/profile", "PUT", profile, "other")).status, 200);
  for (const invalid of [{ ...body, acknowledged: false }, { ...body, reason: " " }, { ...body, reasonCategory: "Unknown" }, { ...body, reason: "x".repeat(1001) }]) assert.equal((await call("/cancellations", "POST", invalid)).status, 400);
});
test("concurrent cancellation submissions create one request and preserve active admission", async () => {
  const results = await Promise.all([call("/cancellations", "POST", { ...body, status: "approved", student: new mongoose.Types.ObjectId(), institution: "Forged" }), call("/cancellations", "POST", body)]);
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
  const record = results.find(result => result.status === 201).body.cancellation; id = record._id;
  assert.equal(record.status, "pending"); assert.equal(record.student.name, "student"); assert.equal(record.institution, "Sample College A");
  assert.equal((await call("/profile")).body.student.admissionStatus, "active");
  assert.equal((await call("/profile", "PUT", profile)).status, 409);
  assert.equal((await call("/transfers", "POST", transferBody)).status, 409);
});
test("student records are private; only staff review and admin decides", async () => {
  assert.equal((await call(`/cancellations/${id}`, "GET", undefined, "other")).status, 404);
  assert.equal((await call("/cancellations", "GET", undefined, "other")).body.cancellations.length, 0);
  assert.equal((await call("/cancellations", "POST", body, "staff")).status, 403);
  assert.equal((await call(`/cancellations/${id}/review`, "PUT", { recommendation: "approved", reviewNotes: "Checked" })).status, 403);
  assert.equal((await call(`/cancellations/${id}/status`, "PUT", { status: "approved", decisionReason: "Checked" }, "staff")).status, 403);
  assert.equal((await call(`/cancellations/${id}/status`, "PUT", { status: "approved", decisionReason: "Checked" }, "admin")).status, 409);
  assert.equal((await call(`/cancellations/${id}/review`, "PUT", { recommendation: "approved", reviewNotes: " " }, "staff")).status, 400);
});
test("staff recommendation is recorded; rejection keeps admission active and releases reservation", async () => {
  const reviewed = await call(`/cancellations/${id}/review`, "PUT", { recommendation: "approved", reviewNotes: "Sample admission and reason checked" }, "staff");
  assert.equal(reviewed.status, 200); assert.equal(reviewed.body.cancellation.status, "under_review"); assert.equal(reviewed.body.cancellation.reviewedBy.role, "staff");
  assert.equal((await call("/profile")).body.student.admissionStatus, "active");
  const result = await call(`/cancellations/${id}/status`, "PUT", { status: "rejected", decisionReason: "Sample rejection: requested clarification" }, "admin");
  assert.equal(result.status, 200); assert.equal(result.body.cancellation.status, "rejected"); assert.ok(result.body.cancellation.decidedAt); assert.equal(result.body.cancellation.processedBy.role, "admin");
  const student = (await call("/profile")).body.student; assert.equal(student.admissionStatus, "active"); assert.equal(student.cancellationStatus, "rejected");
  assert.equal((await Student.findById(student._id)).activeRequest, undefined);
  assert.equal((await call(`/cancellations/${id}/review`, "PUT", { recommendation: "approved", reviewNotes: "Again" }, "staff")).status, 409);
});
test("approval cancels admission consistently and finalized decisions cannot be changed", async () => {
  const record = (await call("/cancellations", "POST", body)).body.cancellation; id = record._id;
  assert.equal((await call(`/cancellations/${id}/review`, "PUT", { recommendation: "approved", reviewNotes: "Reason checked" }, "staff")).status, 200);
  assert.equal((await call(`/cancellations/${id}/status`, "PUT", { status: "approved", decisionReason: " " }, "admin")).status, 400);
  assert.equal((await call(`/cancellations/${id}/status`, "PUT", { status: "approved", decisionReason: "Cancellation approved after review" }, "admin")).status, 200);
  const profileResult = (await call("/profile")).body.student; assert.equal(profileResult.admissionStatus, "cancelled");
  const staff = (await call(`/students/${profileResult._id}`, "GET", undefined, "staff")).body.student; assert.equal(staff.admissionStatus, "cancelled");
  assert.equal((await call("/cancellations", "POST", body)).status, 409); assert.equal((await call("/transfers", "POST", transferBody)).status, 409);
  assert.equal((await call("/profile", "PUT", profile)).status, 409);
  assert.equal((await call(`/cancellations/${id}/status`, "PUT", { status: "rejected", decisionReason: "Overwrite" }, "admin")).status, 409);
});
test("transfer and cancellation racing for the same student cannot both open", async () => {
  const results = await Promise.all([call("/transfers", "POST", transferBody, "other"), call("/cancellations", "POST", body, "other")]);
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
  const transferWon = results[0].status === 201, record = transferWon ? results[0].body.transfer : results[1].body.cancellation;
  if (!transferWon) await call(`/cancellations/${record._id}/review`, "PUT", { recommendation: "rejected", reviewNotes: "Sample review" }, "staff");
  const route = transferWon ? "transfers" : "cancellations";
  assert.equal((await call(`/${route}/${record._id}/status`, "PUT", transferWon ? { status: "rejected", remarks: "Sample rejection" } : { status: "rejected", decisionReason: "Sample rejection" }, "admin")).status, 200);
  const retry = await call(transferWon ? "/cancellations" : "/transfers", "POST", transferWon ? body : transferBody, "other"); assert.equal(retry.status, 201);
});
test("cancellation after a completed program switch snapshots destination admission", async () => {
  const student = await Student.findOne({ email: "switched@example.test" });
  await Transfer.create({ ...transferBody, student: student._id, previousInstitution: profile.previousInstitution, previousProgram: "BCA", currentProgram: "BSc Computer Science", destinationInstitution: "Sample University B", destinationSemester: 3, curriculumVersion: "2026-demo", status: "approved" });
  const created = await call("/cancellations", "POST", body, "switched"); assert.equal(created.status, 201); assert.equal(created.body.cancellation.institution, "Sample University B"); assert.equal(created.body.cancellation.program, "BSc Computer Science");
  const requestId = created.body.cancellation._id;
  await call(`/cancellations/${requestId}/review`, "PUT", { recommendation: "rejected", reviewNotes: "Sample review" }, "staff");
  await call(`/cancellations/${requestId}/status`, "PUT", { status: "rejected", decisionReason: "Admission continues" }, "admin");
  assert.equal((await call("/profile", "GET", undefined, "switched")).body.student.admissionStatus, "transferred");
});
test("failed request creation releases its reservation for retry", async () => {
  const failed = await call("/transfers", "POST", { ...transferBody, previousSubjects: [{ ...transferBody.previousSubjects[0], topics: { invalid: true } }] }, "race"); assert.equal(failed.status, 400);
  const student = await Student.findOne({ email: "race@example.test" }); assert.equal(student.activeRequest, undefined);
  const created = await call("/cancellations", "POST", body, "race"); assert.equal(created.status, 201); id = created.body.cancellation._id;
  await call(`/cancellations/${id}/review`, "PUT", { recommendation: "approved", reviewNotes: "Race review" }, "staff");
});
test("simultaneous admin decisions record exactly one final outcome", async () => {
  const results = await Promise.all([call(`/cancellations/${id}/status`, "PUT", { status: "approved", decisionReason: "First decision" }, "admin"), call(`/cancellations/${id}/status`, "PUT", { status: "rejected", decisionReason: "Second decision" }, "admin")]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  const saved = await Cancellation.findById(id); assert.equal(saved.status, results.find(result => result.status === 200).body.cancellation.status);
});
