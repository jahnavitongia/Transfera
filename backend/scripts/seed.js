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
  const demoUser = await User.findOne({ email: "student@transfera.demo" });
  await Student.updateOne({ studentId: "DEMO001" }, { $set: { user: demoUser._id, dateOfBirth: new Date("2005-04-12"), previousStudentId: "A-101" } });
  await Student.updateOne({ studentId: "DEMO002" }, { $setOnInsert: { studentId: "DEMO002", name: "Aarav Sharm", email: "possible-duplicate@example.test", phone: "9000000002", dateOfBirth: new Date("2005-04-12"), previousStudentId: "A-102", previousInstitution: "Sample College A", previousProgram: "BCA", currentProgram: "BCA", admissionYear: 2025 } }, { upsert: true });
  for (const [code, name, credits, program, semester, topics] of [
    ["BCA101", "Programming Fundamentals", 4, "BCA", 1, "Variables, control flow, functions, arrays"],
    ["BCA102", "Mathematics", 4, "BCA", 1, "Algebra, matrices, calculus"],
    ["BCA201", "Data Structures", 4, "BCA", 2, "Lists, stacks, queues, trees, sorting"],
    ["BCA202", "Database Management Systems", 4, "BCA", 2, "Relational model, SQL, normalization, transactions"],
    ["BSC101", "Programming Fundamentals", 4, "BSc Computer Science", 1, "Variables, control flow, functions, arrays"],
    ["BSC102", "Discrete Mathematics", 4, "BSc Computer Science", 1, "Logic, sets, graphs, combinatorics"],
    ["BSC201", "Data Structures", 4, "BSc Computer Science", 2, "Lists, stacks, queues, trees, sorting"],
    ["BSC202", "Computer Architecture", 4, "BSc Computer Science", 2, "CPU, memory, instruction sets, digital logic"],
  ]) await Subject.updateOne({ code }, { $set: { code, name, credits, program, semester, topics, institution: "Sample University B", curriculumVersion: "2026-demo" } }, { upsert: true });
  console.log("Sample accounts and curriculum ready. Password: TransferaDemo123!");
};
seed().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => mongoose.disconnect());
