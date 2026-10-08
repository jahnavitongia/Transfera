const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  institution: { type: String, required: true },
  program: { type: String, required: true },
  reasonCategory: { type: String, enum: ["Personal circumstances", "Financial reasons", "Different academic plans", "Other"], required: true },
  reason: { type: String, trim: true, required: true, maxlength: 1000 },
  acknowledged: { type: Boolean, required: true },
  status: { type: String, enum: ["pending", "under_review", "approved", "rejected"], default: "pending" },
  recommendation: { type: String, enum: ["approved", "rejected"] },
  reviewNotes: { type: String, trim: true, maxlength: 2000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,
  decisionReason: { type: String, trim: true, maxlength: 2000 },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  decidedAt: Date,
}, { timestamps: true });
schema.index({ student: 1 }, { unique: true, partialFilterExpression: { status: { $in: ["pending", "under_review"] } } });
module.exports = mongoose.model("Cancellation", schema);
