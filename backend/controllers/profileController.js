const Student = require("../models/student");
const Transfer = require("../models/Transfer");
const policy = require("../config/demoPolicy");
const withStudentStatus = require("../services/studentStatus");
const getProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    res.json({ student: student ? (await withStudentStatus([student]))[0] : null, policy });
  } catch (error) { next(error); }
};
const saveProfile = async (req, res, next) => {
  try {
    const { phone, dateOfBirth, previousStudentId, previousInstitution, previousProgram, admissionYear } = req.body;
    const birth = new Date(dateOfBirth);
    if (typeof phone !== "string" || !/^\d{10}$/.test(phone) || !dateOfBirth || !Number.isFinite(birth.getTime()) || birth >= new Date() ||
        ![previousStudentId, previousInstitution].every(value => typeof value === "string" && value.trim()) || !policy.programs.includes(previousProgram) ||
        !Number.isInteger(Number(admissionYear)) || Number(admissionYear) < 2000 || Number(admissionYear) > new Date().getFullYear()) {
      return res.status(400).json({ message: "Enter a 10-digit phone, valid birth date, previous ID/institution/program, and admission year" });
    }
    const existing = await Student.findOne({ user: req.user.id });
    if (existing && await Transfer.exists({ student: existing._id, status: { $in: ["pending", "under_review"] } })) {
      return res.status(409).json({ message: "Your profile is locked while a transfer is being reviewed" });
    }
    const student = await Student.findOneAndUpdate({ user: req.user.id }, {
      $set: { name: req.user.name, email: req.user.email, phone, dateOfBirth: birth,
        previousStudentId: previousStudentId.trim(), previousInstitution: previousInstitution.trim(), previousProgram, admissionYear: Number(admissionYear) },
      $setOnInsert: { user: req.user.id, studentId: `STU-${req.user.id}`, currentProgram: previousProgram },
    }, { returnDocument: "after", upsert: true, runValidators: true });
    res.json({ student: (await withStudentStatus([student]))[0] });
  } catch (error) { next(error); }
};
module.exports = { getProfile, saveProfile };
