const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Student = require("../models/student");
const Subject = require("../models/Subject");

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const password = await bcrypt.hash("TransferaDemo123!", 12);
  for (const [name, email, role] of [
    ["Demo Admin", "admin@transfera.demo", "admin"],
    ["Demo Staff", "staff@transfera.demo", "staff"],
    ["Aarav Sharma", "student@transfera.demo", "student"],
  ]) {
    await User.updateOne({ email }, { $setOnInsert: { name, email, role, password } }, { upsert: true });
  }
  await Student.updateOne({ studentId: "DEMO001" }, { $setOnInsert: {
    studentId: "DEMO001", name: "Aarav Sharma", email: "student@transfera.demo",
    phone: "9000000001", previousInstitution: "Sample College A", previousProgram: "BCA",
    currentProgram: "BCA", admissionYear: 2026,
  } }, { upsert: true });
  for (const [code, name, credits, program, semester] of [
    ["BCA101", "Programming Fundamentals", 4, "BCA", 1],
    ["BCA102", "Mathematics", 4, "BCA", 1],
    ["BCA201", "Data Structures", 4, "BCA", 2],
    ["BCA202", "Database Management Systems", 4, "BCA", 2],
    ["BSC101", "Programming Fundamentals", 4, "BSc Computer Science", 1],
    ["BSC102", "Discrete Mathematics", 4, "BSc Computer Science", 1],
  ]) await Subject.updateOne({ code }, { $setOnInsert: { code, name, credits, program, semester } }, { upsert: true });
  console.log("Sample accounts and curriculum ready. Password: TransferaDemo123!");
};
seed().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => mongoose.disconnect());
