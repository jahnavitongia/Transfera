const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const mongoose = require("mongoose");
const resetDemo = require("../scripts/reset-demo");
const pilot = require("../config/computingPilot.json");
const User = require("../models/user");
const Student = require("../models/student");
const Transfer = require("../models/Transfer");
const Cancellation = require("../models/Cancellation");
const SubjectMapping = require("../models/SubjectMapping");
const PreviousSubject = require("../models/PreviousSubject");
const database = "transfera_demo_reset_test";
let demoStudents, otherStudent, backup;
before(async () => {
  await mongoose.connect(`mongodb://127.0.0.1:27018/${database}`);
  demoStudents = [];
  for (const [email, studentId] of [["transfer@transfera.demo", "DEMO-TRANSFER"], ["cancellation@transfera.demo", "DEMO-CANCEL"], ["soc.transfer@transfera.demo", "PILOT-T01"], ["soc.cancel@transfera.demo", "PILOT-C01"], ["unrelated@example.test", "OTHER"]]) {
    const user = await User.create({ email, name: studentId, role: "student", password: "test-fixture" });
    // Pilot profiles start edited so the test can confirm the fixture values come back.
    const student = await Student.create({ email, studentId, user: user._id, name: studentId, currentProgram: "BCA", admissionYear: 2026, phone: "9999999999", previousProgram: "Edited during rehearsal", admissionStatus: "cancelled", activeRequest: { kind: "transfer", id: new mongoose.Types.ObjectId() } });
    if (studentId === "OTHER") otherStudent = student; else demoStudents.push(student);
    // Request fixtures only need ownership fields for this cleanup contract.
    const transferId = new mongoose.Types.ObjectId();
    await Transfer.collection.insertOne({ _id: transferId, student: student._id, status: "approved", transcript: { content: "fictional transcript" } });
    await Cancellation.collection.insertOne({ student: student._id, status: "approved" });
    await SubjectMapping.collection.insertOne({ transfer: transferId });
    await PreviousSubject.collection.insertOne({ transfer: transferId });
  }
  await mongoose.connection.collection("subjects").insertOne({ code: "UNCHANGED-CURRICULUM" });
});
after(async () => {
  if (backup) await fs.unlink(backup);
  assert.equal(mongoose.connection.name, database);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
test("reset backs up and clears only the four presentation students, preserving accounts, other requests and curriculum", async () => {
  const preview = await resetDemo({ preview: true });
  assert.deepEqual(preview, { transfers: 4, cancellations: 4 });
  assert.equal(await Transfer.countDocuments(), 5);
  const result = await resetDemo(); backup = result.backup;
  const saved = JSON.parse(await fs.readFile(backup, "utf8"));
  assert.equal(saved.transfers.length, 4);
  assert.equal(saved.transfers[0].transcript.content, "fictional transcript");
  for (const model of [Transfer, Cancellation]) {
    assert.equal(await model.countDocuments(), 1);
    assert.equal(await model.countDocuments({ student: otherStudent._id }), 1);
  }
  assert.equal(await SubjectMapping.countDocuments(), 1);
  assert.equal(await PreviousSubject.countDocuments(), 1);
  assert.equal(await User.countDocuments(), 5);
  assert.equal(await Student.countDocuments(), 5);
  assert.equal(await mongoose.connection.collection("subjects").countDocuments(), 1);
  for (const original of demoStudents) {
    const student = await Student.findById(original._id);
    assert.equal(student.admissionStatus, "active");
    assert.equal(student.transferStatus, "not_applicable");
    assert.equal(student.activeRequest, undefined);
    const fixture = pilot.students.find(profile => profile.studentId === original.studentId);
    assert.equal(student.name, fixture?.name ?? original.name);
    assert.equal(student.phone, fixture?.phone ?? "9999999999");
    if (fixture) {
      assert.equal(student.previousProgram, fixture.previousProgram);
      assert.equal(student.currentProgram, fixture.previousProgram);
      assert.equal(student.dateOfBirth.toISOString().slice(0, 10), fixture.dateOfBirth);
    }
  }
  assert.equal((await Student.findById(otherStudent._id)).admissionStatus, "cancelled");
  assert.deepEqual(await resetDemo({ preview: true }), { transfers: 0, cancellations: 0 });
});
test("unexpected demo profile identity prevents all deletion", async () => {
  await Student.updateOne({ _id: demoStudents[0]._id }, { $set: { studentId: "CHANGED" } });
  await assert.rejects(resetDemo(), /ownership does not match/);
  assert.equal(await Transfer.countDocuments(), 1);
  assert.equal(await Cancellation.countDocuments(), 1);
});
