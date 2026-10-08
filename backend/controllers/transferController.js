const mongoose = require("mongoose");
const Transfer = require("../models/Transfer");
const Student = require("../models/student");
const Subject = require("../models/Subject");
const { reserveRequest, releaseRequest } = require("../services/admissionWorkflow");
const policy = require("../config/demoPolicy");
const { buildEvaluation, summarize, findDuplicateFlags } = require("../services/transferMapping");

const serialize = (transfer, user) => {
  const value = transfer.toObject ? transfer.toObject() : transfer;
  delete value.transcript?.content;
  const summary = summarize(value.evaluation);
  value.summary = { ...summary, reviewedCredits: summary.awardedCredits, awardedCredits: value.status === "approved" ? summary.awardedCredits : 0 };
  value.recordCheck = { flagCount: value.duplicateFlags.length, cleared: value.recordCheckCleared };
  if (user.role === "student") delete value.duplicateFlags;
  return value;
};
const findAccessible = async (req) => {
  const id = req.params.id || req.params.transferId;
  if (!mongoose.isValidObjectId(id)) return null;
  const filter = { _id: id };
  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user.id }).select("_id");
    if (!student) return null;
    filter.student = student._id;
  }
  return Transfer.findOne(filter).populate("student", "studentId name email phone dateOfBirth previousStudentId").populate("reviewedBy processedBy", "name role");
};
const createTransfer = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student?.dateOfBirth || !student.previousStudentId) return res.status(400).json({ message: "Complete your student profile first" });
    if (student.admissionStatus === "cancelled") return res.status(409).json({ message: "A cancelled admission cannot submit a transfer" });
    if (await Transfer.exists({ student: student._id, status: "approved" })) return res.status(409).json({ message: "Your demo transfer is already completed" });
    const { currentProgram, destinationSemester, transferReason, previousSubjects, transcript } = req.body;
    if (!policy.programs.includes(currentProgram) || !policy.destinationSemesters.includes(Number(destinationSemester)) || typeof transferReason !== "string" || !transferReason.trim() ||
        !Array.isArray(previousSubjects) || !previousSubjects.length || previousSubjects.length > 30) {
      return res.status(400).json({ message: "Choose a supported destination and enter a reason and completed subjects" });
    }
    if (previousSubjects.some(subject => typeof subject.code !== "string" || !subject.code.trim() || typeof subject.name !== "string" || !subject.name.trim() ||
        !Number.isInteger(Number(subject.credits)) || Number(subject.credits) < 1 || Number(subject.credits) > 30 ||
        subject.gradePoint === "" || subject.gradePoint == null || !Number.isFinite(Number(subject.gradePoint)) || Number(subject.gradePoint) < 0 || Number(subject.gradePoint) > 10)) {
      return res.status(400).json({ message: "Each subject needs a code, name, positive integer credits and grade points from 0 to 10" });
    }
    if (new Set(previousSubjects.map(subject => subject.code.trim().toUpperCase())).size !== previousSubjects.length) return res.status(400).json({ message: "Each completed subject code must be unique" });
    if (!transcript || typeof transcript.content !== "string" || !["application/pdf", "text/plain"].includes(transcript.mimeType) || typeof transcript.fileName !== "string") return res.status(400).json({ message: "Attach a PDF or text transcript (up to 2 MB)" });
    const bytes = Buffer.from(transcript.content, "base64");
    if (!bytes.length || bytes.length > 2 * 1024 * 1024 || (transcript.mimeType === "application/pdf" && bytes.subarray(0, 5).toString() !== "%PDF-")) return res.status(400).json({ message: "Transcript is empty, too large, or not a valid PDF" });
    const others = await Student.find({ _id: { $ne: student._id } }).select("name phone dateOfBirth previousStudentId previousInstitution");
    const requestId = await reserveRequest(student._id, "transfer");
    let transfer;
    try { transfer = await Transfer.create({ _id: requestId, student: student._id,
      previousInstitution: student.previousInstitution, previousProgram: student.previousProgram,
      currentProgram, destinationSemester: Number(destinationSemester), destinationInstitution: policy.institution,
      curriculumVersion: policy.curriculumVersion, transferReason: transferReason.trim(),
      previousSubjects: previousSubjects.map(subject => ({ code: subject.code, name: subject.name,
        credits: Number(subject.credits), gradePoint: Number(subject.gradePoint), topics: subject.topics || "" })),
      transcript: { fileName: transcript.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 100), mimeType: transcript.mimeType, content: transcript.content },
      duplicateFlags: findDuplicateFlags(student, others) });
    } catch (error) { await releaseRequest(student._id, "transfer", requestId); throw error; }
    res.status(201).json({ transfer: serialize(transfer, req.user) });
  } catch (error) { next(error); }
};
const getTransfers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "student") {
      const student = await Student.findOne({ user: req.user.id }).select("_id");
      if (!student) return res.json({ count: 0, transfers: [] });
      filter.student = student._id;
    }
    const transfers = await Transfer.find(filter).populate("student", "studentId name email").populate("reviewedBy processedBy", "name role").sort({ createdAt: -1 });
    res.json({ count: transfers.length, transfers: transfers.map(transfer => serialize(transfer, req.user)), policy });
  } catch (error) { next(error); }
};
const getTransferById = async (req, res, next) => {
  try {
    const transfer = await findAccessible(req);
    if (!transfer) return res.status(404).json({ message: "Transfer request not found" });
    res.json({ transfer: serialize(transfer, req.user), policy });
  } catch (error) { next(error); }
};
const evaluateTransfer = async (req, res, next) => {
  try {
    const transfer = await findAccessible(req);
    if (!transfer) return res.status(404).json({ message: "Transfer request not found" });
    if (!["pending", "under_review"].includes(transfer.status)) return res.status(409).json({ message: "Finalized requests cannot be evaluated again" });
    const subjects = await Subject.find({ program: transfer.currentProgram, institution: transfer.destinationInstitution,
      curriculumVersion: transfer.curriculumVersion, semester: { $lt: transfer.destinationSemester } }).sort({ semester: 1, code: 1 });
    if (!subjects.length) return res.status(400).json({ message: "No destination curriculum is available" });
    const evaluation = buildEvaluation(transfer.previousSubjects, subjects, req.user.id);
    const updated = await Transfer.findOneAndUpdate({ _id: transfer._id, updatedAt: transfer.updatedAt, status: { $in: ["pending", "under_review"] } },
      { $set: { evaluation, status: "under_review", reviewNotes: "", recordCheckCleared: false }, $unset: { reviewedAt: 1, reviewedBy: 1 } }, { returnDocument: "after", runValidators: true });
    if (!updated) return res.status(409).json({ message: "Request changed. Refresh before evaluating" });
    await updated.populate("student", "studentId name email phone dateOfBirth previousStudentId");
    await updated.populate("reviewedBy processedBy", "name role");
    res.json({ transfer: serialize(updated, req.user) });
  } catch (error) { next(error); }
};
const reviewTransfer = async (req, res, next) => {
  try {
    const transfer = await findAccessible(req);
    if (!transfer) return res.status(404).json({ message: "Transfer request not found" });
    if (transfer.status !== "under_review" || !transfer.evaluation?.evaluatedAt) return res.status(409).json({ message: "Evaluate this request before reviewing it" });
    const { acceptedCodes, reviewNotes, clearRecordFlags } = req.body;
    if (!Array.isArray(acceptedCodes) || new Set(acceptedCodes).size !== acceptedCodes.length || typeof reviewNotes !== "string" || !reviewNotes.trim()) return res.status(400).json({ message: "Choose matches and enter your review notes" });
    const evaluation = transfer.toObject().evaluation;
    if (acceptedCodes.some(code => !evaluation.matches.some(match => match.currentCode === code && match.eligible))) return res.status(400).json({ message: "Failed grades, insufficient credits and unmatched subjects cannot receive credit" });
    for (const match of evaluation.matches) { match.decision = acceptedCodes.includes(match.currentCode) ? "accepted" : "declined"; match.awardedCredits = match.decision === "accepted" ? match.currentCredits : 0; }
    if (summarize(evaluation).awardedCredits > evaluation.maximumTransferCredits) return res.status(400).json({ message: "Accepted credits exceed the sample transfer limit" });
    if (transfer.duplicateFlags.length && clearRecordFlags !== true) return res.status(400).json({ message: "Review the possible duplicate flags before completing review" });
    const updated = await Transfer.findOneAndUpdate({ _id: transfer._id, updatedAt: transfer.updatedAt, status: "under_review" },
      { $set: { evaluation, reviewNotes: reviewNotes.trim(), reviewedBy: req.user.id, reviewedAt: new Date(), recordCheckCleared: true } }, { returnDocument: "after", runValidators: true });
    if (!updated) return res.status(409).json({ message: "Request changed. Refresh before saving review" });
    await updated.populate("student", "studentId name email phone dateOfBirth previousStudentId");
    await updated.populate("reviewedBy processedBy", "name role");
    res.json({ transfer: serialize(updated, req.user) });
  } catch (error) { next(error); }
};
const updateTransferStatus = async (req, res, next) => {
  try {
    const transfer = await findAccessible(req);
    if (!transfer) return res.status(404).json({ message: "Transfer request not found" });
    const { status, remarks } = req.body;
    if (!["approved", "rejected"].includes(status) || typeof remarks !== "string" || !remarks.trim()) return res.status(400).json({ message: "Choose approve/reject and give a decision reason" });
    if (!["pending", "under_review"].includes(transfer.status)) return res.status(409).json({ message: "This request already has a final decision" });
    if (status === "approved" && (!transfer.reviewedAt || !transfer.recordCheckCleared || !summarize(transfer.evaluation).awardedCredits)) return res.status(409).json({ message: "Complete staff review and confirm eligible credits before approval" });
    const updated = await Transfer.findOneAndUpdate({ _id: transfer._id, updatedAt: transfer.updatedAt, status: { $in: ["pending", "under_review"] } },
      { $set: { status, remarks: remarks.trim(), processedBy: req.user.id, decidedAt: new Date() } }, { returnDocument: "after", runValidators: true });
    if (!updated) return res.status(409).json({ message: "Request changed. Refresh before deciding" });
    await releaseRequest(transfer.student._id, "transfer", transfer._id);
    await updated.populate("student", "studentId name email phone dateOfBirth previousStudentId");
    await updated.populate("reviewedBy processedBy", "name role");
    res.json({ transfer: serialize(updated, req.user) });
  } catch (error) { next(error); }
};
const downloadTranscript = async (req, res, next) => {
  try {
    const accessible = await findAccessible(req);
    if (!accessible) return res.status(404).json({ message: "Transfer request not found" });
    const transfer = await Transfer.findById(accessible._id).select("+transcript.content");
    if (!transfer.transcript?.content) return res.status(404).json({ message: "No transcript attached" });
    res.set("Content-Type", transfer.transcript.mimeType).attachment(transfer.transcript.fileName).send(Buffer.from(transfer.transcript.content, "base64"));
  } catch (error) { next(error); }
};
module.exports = { createTransfer, getTransfers, getTransferById, evaluateTransfer, reviewTransfer, updateTransferStatus, downloadTranscript };
