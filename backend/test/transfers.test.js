const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
process.env.JWT_SECRET = "transfer-test-secret-only";
const app = require("../app");
const User = require("../models/user");
const Student = require("../models/student");
const Subject = require("../models/Subject");
const Transfer = require("../models/Transfer");
const { buildEvaluation } = require("../services/transferMapping");
let server, base, tokens = {}, id, switchId;
const database = "transfera_transfers_test";
const call = async (url, method = "GET", body, role = "student") => {
  const response = await fetch(base + url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens[role]}` }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, body: await response.json() };
};
const profile = { phone: "9000000001", dateOfBirth: "2005-04-12", previousStudentId: "OLD-1", previousInstitution: "Sample College A", previousProgram: "BCA", admissionYear: 2025 };
const body = { currentProgram: "BCA", destinationSemester: 3, transferReason: "Relocation", transcript: { fileName: "transcript.txt", mimeType: "text/plain", content: Buffer.from("FICTIONAL TEST TRANSCRIPT").toString("base64") }, previousSubjects: [
  { code: "OLD101", name: "Intro to Programming", credits: 4, gradePoint: 8, topics: "Variables, functions" },
  { code: "OLD102", name: "Mathematics", credits: 4, gradePoint: 3 },
  { code: "OLD201", name: "Data Structures", credits: 4, gradePoint: 7 },
  { code: "OLD202", name: "DBMS", credits: 2, gradePoint: 8 },
] };
before(async () => {
  await mongoose.connect(`mongodb://127.0.0.1:27018/${database}`);
  await Promise.all([User.init(), Student.init(), Transfer.init(), Subject.init()]);
  const password = await bcrypt.hash("TestPassword123!", 4);
  for (const role of ["student", "other", "staff", "admin"]) await User.create({ name: role === "student" ? "Test Student" : role === "other" ? "Another Learner" : role, email: `${role}@example.test`, password, role: role === "other" ? "student" : role });
  await Student.create({ studentId: "FLAG", name: "Test Studen", email: "flag@example.test", phone: "9000000099", dateOfBirth: new Date(profile.dateOfBirth), previousStudentId: "OLD-2", previousInstitution: "Sample College A", previousProgram: "BCA", currentProgram: "BCA", admissionYear: 2025 });
  for (const program of ["BCA", "BSc Computer Science"]) {
    const prefix = program === "BCA" ? "BCA" : "BSC";
    for (const [suffix, name, semester] of [["101", "Programming Fundamentals", 1], ["102", program === "BCA" ? "Mathematics" : "Discrete Mathematics", 1], ["201", "Data Structures", 2], ["202", program === "BCA" ? "Database Management Systems" : "Computer Architecture", 2]]) await Subject.create({ code: prefix + suffix, name, credits: 4, program, semester });
  }
  await Subject.create({ code: "NOISE", name: "Programming Fundamentals", credits: 4, program: "MBA", semester: 1 });
  await Subject.create({ code: "FUTURE", name: "Operating Systems", credits: 4, program: "BCA", semester: 3 });
  await Subject.create({ code: "OTHER-INSTITUTION", name: "Operating Systems", credits: 4, program: "BCA", institution: "Other University", semester: 1 });
  server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
  for (const role of ["student", "other", "staff", "admin"]) {
    const response = await fetch(base + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: `${role}@example.test`, password: "TestPassword123!" }) });
    tokens[role] = (await response.json()).token;
  }
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1) { assert.equal(mongoose.connection.name, database); await mongoose.connection.dropDatabase(); }
  await mongoose.disconnect();
});
test("profile is owned by authenticated account; incomplete and invalid submissions fail", async () => {
  assert.equal((await call("/transfers", "POST", body)).status, 400);
  assert.equal((await call("/profile", "PUT", { ...profile, phone: "bad" })).status, 400);
  const result = await call("/profile", "PUT", { ...profile, name: "Impersonated", user: new mongoose.Types.ObjectId().toString(), email: "stolen@example.test" });
  assert.equal(result.status, 200); assert.equal(result.body.student.name, "Test Student"); assert.equal(result.body.student.email, "student@example.test");
  assert.equal((await call("/profile", "PUT", { ...profile, previousStudentId: "OTHER-1", phone: "9000000003" }, "other")).status, 200);
  assert.equal((await call("/transfers", "POST", { ...body, previousSubjects: [{ ...body.previousSubjects[0], credits: -1 }] })).status, 400);
  assert.equal((await call("/transfers", "POST", { ...body, transcript: { fileName: "invalid.pdf", mimeType: "application/pdf", content: Buffer.from("not a PDF").toString("base64") } })).status, 400);
});
test("concurrent duplicate submissions create exactly one active request", async () => {
  const results = await Promise.all([call("/transfers", "POST", body), call("/transfers", "POST", body)]);
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
  const transfer = results.find(result => result.status === 201).body.transfer; id = transfer._id;
  assert.equal(transfer.status, "pending"); assert.equal(transfer.summary.awardedCredits, 0);
  assert.equal(transfer.transcript.content, undefined); assert.equal(transfer.duplicateFlags, undefined); assert.equal(transfer.recordCheck.flagCount, 1);
  assert.equal((await call("/profile", "PUT", profile)).status, 409);
});
test("students cannot see another student's application or transcript or perform reviews", async () => {
  assert.equal((await call(`/transfers/${id}`, "GET", undefined, "other")).status, 404);
  const download = await fetch(base + `/transfers/${id}/transcript`, { headers: { Authorization: `Bearer ${tokens.other}` } }); assert.equal(download.status, 404);
  assert.equal((await call(`/transfers/${id}/evaluate`, "POST", {})).status, 403);
  assert.equal((await call(`/transfers/${id}/review`, "PUT", {})).status, 403);
  assert.equal((await call("/transfers", "GET", undefined, "other")).body.count, 0);
  assert.equal((await call(`/transfers/${id}/status`, "PUT", { status: "approved", remarks: "test" }, "staff")).status, 403);
});
test("evaluation uses destination program/institution/semester and does not award credits", async () => {
  assert.equal((await call(`/transfers/${id}/status`, "PUT", { status: "approved", remarks: "Premature" }, "admin")).status, 409);
  const result = await call(`/transfers/${id}/evaluate`, "POST", {}, "staff"); assert.equal(result.status, 200, JSON.stringify(result.body));
  const transfer = result.body.transfer;
  assert.equal(transfer.status, "under_review"); assert.equal(transfer.evaluation.matches.length, 4);
  assert(transfer.evaluation.matches.every(match => match.currentCode.startsWith("BCA")));
  assert.equal(new Set(transfer.evaluation.matches.map(match => match.previousCode).filter(Boolean)).size, 4);
  assert.equal(transfer.evaluation.matches.find(match => match.currentCode === "BCA102").eligible, false);
  assert.equal(transfer.evaluation.matches.find(match => match.currentCode === "BCA202").eligible, false);
  assert.equal(transfer.summary.awardedCredits, 0); assert.equal(transfer.summary.suggestedCredits, 8);
});
test("staff review enforces grade, credit, duplicate checks and transfer cap", async () => {
  const review = { acceptedCodes: ["BCA101", "BCA201"], reviewNotes: "Transcript and syllabus checked; record flag investigated", clearRecordFlags: true };
  assert.equal((await call(`/transfers/${id}/review`, "PUT", { ...review, acceptedCodes: ["BCA102"] }, "staff")).status, 400);
  assert.equal((await call(`/transfers/${id}/review`, "PUT", { ...review, acceptedCodes: ["BCA202"] }, "staff")).status, 400);
  assert.equal((await call(`/transfers/${id}/review`, "PUT", { ...review, clearRecordFlags: false }, "staff")).status, 400);
  await Transfer.updateOne({ _id: id }, { $set: { "evaluation.maximumTransferCredits": 4 } });
  assert.equal((await call(`/transfers/${id}/review`, "PUT", review, "staff")).status, 400);
  await Transfer.updateOne({ _id: id }, { $set: { "evaluation.maximumTransferCredits": 60 } });
  const result = await call(`/transfers/${id}/review`, "PUT", review, "staff"); assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.transfer.summary.reviewedCredits, 8); assert.equal(result.body.transfer.summary.awardedCredits, 0);
  assert.equal(result.body.transfer.summary.subjectsRemaining.length, 2);
});
test("admin decision awards credits once; student and staff views agree", async () => {
  const result = await call(`/transfers/${id}/status`, "PUT", { status: "approved", remarks: "Approved with two outstanding subjects" }, "admin");
  assert.equal(result.status, 200, JSON.stringify(result.body)); assert.equal(result.body.transfer.summary.awardedCredits, 8);
  const profileResult = await call("/profile"); assert.equal(profileResult.body.student.admissionStatus, "transferred"); assert.equal(profileResult.body.student.transferStatus, "completed");
  const staffStudents = await call("/students", "GET", undefined, "staff"); assert.equal(staffStudents.body.students.find(student => student.email === "student@example.test").transferStatus, "completed");
  assert.equal((await call(`/transfers/${id}/evaluate`, "POST", {}, "staff")).status, 409);
  assert.equal((await call(`/transfers/${id}/status`, "PUT", { status: "rejected", remarks: "overwrite" }, "admin")).status, 409);
  assert.equal((await call("/transfers", "POST", body)).status, 409);
});
test("program-switch comparison and failed reevaluation preserve the stored result", async () => {
  const created = await call("/transfers", "POST", { ...body, currentProgram: "BSc Computer Science" }, "other"); assert.equal(created.status, 201); switchId = created.body.transfer._id;
  const evaluated = await call(`/transfers/${switchId}/evaluate`, "POST", {}, "staff"); assert.equal(evaluated.status, 200);
  assert(evaluated.body.transfer.evaluation.matches.every(match => match.currentCode.startsWith("BSC")));
  const snapshot = evaluated.body.transfer.evaluation;
  await Subject.updateMany({ program: "BSc Computer Science" }, { $set: { curriculumVersion: "unavailable-test-version" } });
  assert.equal((await call(`/transfers/${switchId}/evaluate`, "POST", {}, "staff")).status, 400);
  assert.deepEqual((await call(`/transfers/${switchId}`, "GET", undefined, "other")).body.transfer.evaluation, snapshot);
  const rejected = await call(`/transfers/${switchId}/status`, "PUT", { status: "rejected", remarks: "Sample rejection path" }, "admin"); assert.equal(rejected.status, 200); assert.equal(rejected.body.transfer.summary.awardedCredits, 0);
  assert.equal((await call("/profile", "GET", undefined, "other")).body.student.transferStatus, "not_applicable");
});
test("one completed subject cannot cover two destination requirements", () => {
  const source = [{ code: "ONE", name: "Programming Fundamentals", credits: 8, gradePoint: 8 }];
  const destination = [1, 2].map(number => ({ _id: new mongoose.Types.ObjectId(), code: `TARGET${number}`, name: "Programming Fundamentals", credits: 4 }));
  const evaluation = buildEvaluation(source, destination, new mongoose.Types.ObjectId());
  assert.equal(evaluation.matches.filter(match => match.eligible).length, 1);
  assert.equal(evaluation.matches[1].decision, "not_matched");
});
