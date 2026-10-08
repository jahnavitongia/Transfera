const mongoose = require("mongoose");
const previousCourse = new mongoose.Schema({
  code: { type: String, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  credits: { type: Number, required: true, min: 1, max: 30 },
  gradePoint: { type: Number, required: true, min: 0, max: 10 },
  topics: { type: String, default: "", maxlength: 2000 },
}, { _id: false });
const match = new mongoose.Schema({
  currentSubject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  currentCode: String, currentName: String, currentCredits: Number, currentTopics: String,
  previousCode: String, previousName: String, previousCredits: Number, gradePoint: Number,
  previousTopics: String, similarity: Number, eligible: Boolean, reason: String,
  decision: { type: String, enum: ["suggested", "review_required", "not_matched", "accepted", "declined"] },
  awardedCredits: { type: Number, default: 0 },
}, { _id: false });
const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  previousInstitution: { type: String, required: true, trim: true },
  previousProgram: { type: String, required: true, trim: true },
  previousYear: { type: Number, default: 1 },
  currentProgram: { type: String, required: true, trim: true },
  destinationInstitution: { type: String, required: true },
  destinationSemester: { type: Number, required: true },
  curriculumVersion: { type: String, required: true },
  transferReason: { type: String, required: true, trim: true, maxlength: 1000 },
  previousSubjects: { type: [previousCourse], required: true },
  transcript: { fileName: String, mimeType: String, content: { type: String, select: false } },
  status: { type: String, enum: ["pending", "under_review", "approved", "rejected"], default: "pending" },
  evaluation: {
    policyLabel: String, maximumTransferCredits: Number, evaluatedAt: Date,
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    matches: [match], totalDestinationCredits: Number,
  },
  duplicateFlags: [{ student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" }, name: String, reason: String, similarity: Number }],
  recordCheckCleared: { type: Boolean, default: false },
  reviewNotes: { type: String, default: "", maxlength: 2000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, reviewedAt: Date,
  remarks: { type: String, default: "", maxlength: 2000 },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, decidedAt: Date,
}, { timestamps: true });
// One active request per student. Finalized requests remain as history.
schema.index({ student: 1 }, { unique: true, partialFilterExpression: { status: { $in: ["pending", "under_review"] } } });
module.exports = mongoose.model("Transfer", schema);
