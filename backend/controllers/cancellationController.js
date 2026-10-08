const mongoose = require("mongoose");
const Cancellation = require("../models/Cancellation");
const Student = require("../models/student");
const withStudentStatus = require("../services/studentStatus");
const { reserveRequest, releaseRequest, openStatuses } = require("../services/admissionWorkflow");
const categories = Cancellation.schema.path("reasonCategory").enumValues;
const populate = query => query.populate([{ path: "student", select: "name email studentId" }, { path: "reviewedBy processedBy", select: "name role" }]);
const accessible = async req => {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  const filter = { _id: req.params.id };
  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user.id }).select("_id");
    if (!student) return null;
    filter.student = student._id;
  }
  return populate(Cancellation.findOne(filter));
};
const create = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student?.dateOfBirth || !student.previousStudentId) return res.status(400).json({ message: "Complete your student profile first" });
    const { reasonCategory, reason, acknowledged } = req.body;
    if (!categories.includes(reasonCategory) || typeof reason !== "string" || !reason.trim() || reason.length > 1000 || acknowledged !== true)
      return res.status(400).json({ message: "Choose a category, give a reason (up to 1000 characters), and acknowledge the cancellation request" });
    const requestId = await reserveRequest(student._id, "cancellation");
    let cancellation;
    try {
      const current = (await withStudentStatus([student]))[0];
      cancellation = await Cancellation.create({ _id: requestId, student: student._id, institution: current.currentInstitution,
        program: current.currentProgram, reasonCategory, reason: reason.trim(), acknowledged: true });
    } catch (error) { await releaseRequest(student._id, "cancellation", requestId); throw error; }
    await populate(cancellation);
    res.status(201).json({ cancellation });
  } catch (error) { next(error); }
};
const list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === "student") {
      const student = await Student.findOne({ user: req.user.id }).select("_id");
      if (!student) return res.json({ cancellations: [], categories });
      filter.student = student._id;
    }
    const cancellations = await populate(Cancellation.find(filter).sort({ createdAt: -1 }));
    res.json({ cancellations, categories });
  } catch (error) { next(error); }
};
const detail = async (req, res, next) => {
  try { const cancellation = await accessible(req); if (!cancellation) return res.status(404).json({ message: "Cancellation request not found" }); res.json({ cancellation }); }
  catch (error) { next(error); }
};
const review = async (req, res, next) => {
  try {
    const cancellation = await accessible(req);
    if (!cancellation) return res.status(404).json({ message: "Cancellation request not found" });
    if (!openStatuses.includes(cancellation.status)) return res.status(409).json({ message: "This request already has a final decision" });
    const { recommendation, reviewNotes } = req.body;
    if (!["approved", "rejected"].includes(recommendation) || typeof reviewNotes !== "string" || !reviewNotes.trim() || reviewNotes.length > 2000)
      return res.status(400).json({ message: "Choose a recommendation and enter staff review notes (up to 2000 characters)" });
    const updated = await populate(Cancellation.findOneAndUpdate({ _id: cancellation._id, updatedAt: cancellation.updatedAt, status: { $in: openStatuses } },
      { $set: { status: "under_review", recommendation, reviewNotes: reviewNotes.trim(), reviewedBy: req.user.id, reviewedAt: new Date() } }, { returnDocument: "after", runValidators: true }));
    if (!updated) return res.status(409).json({ message: "Request changed. Refresh before saving your review" });
    res.json({ cancellation: updated });
  } catch (error) { next(error); }
};
const decide = async (req, res, next) => {
  try {
    const cancellation = await accessible(req);
    if (!cancellation) return res.status(404).json({ message: "Cancellation request not found" });
    if (!openStatuses.includes(cancellation.status)) return res.status(409).json({ message: "This request already has a final decision" });
    if (!cancellation.reviewedAt) return res.status(409).json({ message: "Complete staff review before a final decision" });
    const { status, decisionReason } = req.body;
    if (!["approved", "rejected"].includes(status) || typeof decisionReason !== "string" || !decisionReason.trim() || decisionReason.length > 2000)
      return res.status(400).json({ message: "Choose approve/reject and provide a decision reason (up to 2000 characters)" });
    const updated = await populate(Cancellation.findOneAndUpdate({ _id: cancellation._id, updatedAt: cancellation.updatedAt, status: { $in: openStatuses } },
      { $set: { status, decisionReason: decisionReason.trim(), processedBy: req.user.id, decidedAt: new Date() } }, { returnDocument: "after", runValidators: true }));
    if (!updated) return res.status(409).json({ message: "Request changed. Refresh before deciding" });
    await releaseRequest(cancellation.student._id, "cancellation", cancellation._id);
    res.json({ cancellation: updated });
  } catch (error) { next(error); }
};
module.exports = { create, list, detail, review, decide };
