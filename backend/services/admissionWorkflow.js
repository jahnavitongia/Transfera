const mongoose = require("mongoose");
const Student = require("../models/student");
const Transfer = require("../models/Transfer");
const Cancellation = require("../models/Cancellation");
const openStatuses = ["pending", "under_review"];
const conflict = message => Object.assign(new Error(message), { code: "REQUEST_CONFLICT" });
const releaseRequest = (studentId, kind, requestId) => Student.updateOne({ _id: studentId, "activeRequest.kind": kind, "activeRequest.id": requestId }, { $unset: { activeRequest: 1 } });
// A single atomic student reservation prevents simultaneous transfer/cancellation creation.
// Final decisions remain authoritative in their request documents.
const reserveRequest = async (studentId, kind) => {
  const requestId = new mongoose.Types.ObjectId();
  const student = await Student.findOneAndUpdate({ _id: studentId, activeRequest: { $exists: false } },
    { $set: { activeRequest: { kind, id: requestId } } }, { returnDocument: "after" });
  if (!student) throw conflict("You already have a transfer or cancellation in progress");
  try {
    const [transfer, cancellation, cancelled] = await Promise.all([
      Transfer.exists({ student: studentId, status: { $in: openStatuses } }),
      Cancellation.exists({ student: studentId, status: { $in: openStatuses } }),
      Cancellation.exists({ student: studentId, status: "approved" }),
    ]);
    if (student.admissionStatus === "cancelled" || cancelled) throw conflict("Your admission is cancelled; new requests are unavailable");
    if (transfer || cancellation) throw conflict("Complete your active transfer or cancellation before submitting another request");
    return requestId;
  } catch (error) { await releaseRequest(studentId, kind, requestId); throw error; }
};
module.exports = { reserveRequest, releaseRequest, openStatuses };
