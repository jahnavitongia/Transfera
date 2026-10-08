const Transfer = require("../models/Transfer");
// Transfer documents are the authoritative decision; avoid two independently updated status fields.
const withStudentStatus = async (students) => {
  const records = await Transfer.find({ student: { $in: students.map(student => student._id) } }).select("student status currentProgram").sort({ createdAt: -1 }).lean();
  const latest = new Map();
  for (const record of records) if (!latest.has(String(record.student))) latest.set(String(record.student), record);
  return students.map(student => {
    const record = latest.get(String(student._id));
    return { ...(student.toObject ? student.toObject() : student),
      ...(record ? { transferStatus: ["pending", "under_review"].includes(record.status) ? "pending" : record.status === "approved" ? "completed" : "not_applicable",
        admissionStatus: student.admissionStatus === "cancelled" ? "cancelled" : record.status === "approved" ? "transferred" : "active",
        ...(record.status === "approved" ? { currentProgram: record.currentProgram } : {}) } : {}) };
  });
};
module.exports = withStudentStatus;
