const Transfer = require("../models/Transfer");
const Cancellation = require("../models/Cancellation");
// Request decisions are authoritative; status is derived rather than separately updated.
const withStudentStatus = async students => {
  const filter = { student: { $in: students.map(student => student._id) } };
  const [transfers, cancellations] = await Promise.all([
    Transfer.find(filter).select("student status currentProgram destinationInstitution").sort({ createdAt: -1 }).lean(),
    Cancellation.find(filter).select("student status").sort({ createdAt: -1 }).lean(),
  ]);
  const latest = records => { const map = new Map(); for (const record of records) if (!map.has(String(record.student))) map.set(String(record.student), record); return map; };
  const transferMap = latest(transfers), cancellationMap = latest(cancellations);
  return students.map(student => {
    const value = student.toObject ? student.toObject() : { ...student };
    delete value.activeRequest;
    const transfer = transferMap.get(String(student._id)), cancellation = cancellationMap.get(String(student._id));
    const cancelled = value.admissionStatus === "cancelled" || cancellation?.status === "approved";
    return { ...value,
      admissionStatus: cancelled ? "cancelled" : transfer?.status === "approved" ? "transferred" : value.admissionStatus,
      currentInstitution: transfer?.status === "approved" ? transfer.destinationInstitution : value.previousInstitution,
      currentProgram: transfer?.status === "approved" ? transfer.currentProgram : value.currentProgram,
      transferStatus: transfer ? ["pending", "under_review"].includes(transfer.status) ? "pending" : transfer.status === "approved" ? "completed" : "not_applicable" : value.transferStatus,
      cancellationStatus: cancellation?.status || "not_applicable",
    };
  });
};
module.exports = withStudentStatus;
