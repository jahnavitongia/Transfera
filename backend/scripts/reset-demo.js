const path = require("node:path");
const fs = require("node:fs/promises");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const User = require("../models/user");
const Student = require("../models/student");
const Transfer = require("../models/Transfer");
const Cancellation = require("../models/Cancellation");
const SubjectMapping = require("../models/SubjectMapping");
const PreviousSubject = require("../models/PreviousSubject");
const root = path.resolve(__dirname, "../..");

async function resetDemo({ preview = false } = {}) {
  const students = [];
  for (const [email, studentId] of [["transfer@transfera.demo", "DEMO-TRANSFER"], ["cancellation@transfera.demo", "DEMO-CANCEL"]]) {
    const user = await User.findOne({ email, role: "student" });
    const student = user && await Student.findOne({ user: user._id, email, studentId }).lean();
    if (!student) throw new Error(`Expected demo profile missing or ownership does not match: ${email}. Run the demo setup first.`);
    students.push(student);
  }
  const ids = students.map(student => student._id);
  const filter = { student: { $in: ids } };
  const transfers = await Transfer.find(filter).select("+transcript.content").lean();
  const cancellations = await Cancellation.find(filter).lean();
  const transferFilter = { transfer: { $in: transfers.map(record => record._id) } };
  const mappings = await SubjectMapping.find(transferFilter).lean();
  const previousSubjects = await PreviousSubject.find(transferFilter).lean();
  const summary = { transfers: transfers.length, cancellations: cancellations.length };
  if (preview) return summary;
  const backupDir = path.join(root, ".demo/reset-backups");
  await fs.mkdir(backupDir, { recursive: true });
  const backup = path.join(backupDir, `${Date.now()}-${crypto.randomUUID()}.json`);
  await fs.writeFile(backup, JSON.stringify({ database: mongoose.connection.name, students, transfers, cancellations, mappings, previousSubjects }, null, 2), { flag: "wx", mode: 0o600 });
  await SubjectMapping.deleteMany(transferFilter);
  await PreviousSubject.deleteMany(transferFilter);
  await Transfer.deleteMany(filter);
  await Cancellation.deleteMany(filter);
  await Student.updateMany({ _id: { $in: ids } }, { $set: { admissionStatus: "active", transferStatus: "not_applicable" }, $unset: { activeRequest: 1 } });
  return { ...summary, backup };
}

if (require.main === module) {
  require("dotenv").config({ path: path.join(root, "backend/.env"), quiet: true });
  (async () => {
    const mode = process.argv[2];
    if (!["--preview", "--reset-demo"].includes(mode)) throw new Error("Use --preview or --reset-demo. Reset deletes only the two presentation students' requests.");
    if (!["127.0.0.1", "localhost"].includes(new URL(process.env.MONGO_URI).hostname)) throw new Error("Reset is restricted to a local demo database.");
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    if (mongoose.connection.name !== "transfera_demo") throw new Error("Reset is restricted to the transfera_demo database.");
    const result = await resetDemo({ preview: mode === "--preview" });
    console.log(`${mode === "--preview" ? "Would remove" : "Removed"}: ${result.transfers} transfer requests and ${result.cancellations} cancellation requests for the two demo students.`);
    if (result.backup) {
      console.log("Request backup: " + result.backup);
      console.log("DEMO RESET COMPLETE. Sign out, then sign in again to record both journeys.");
    }
  })().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
}
module.exports = resetDemo;
