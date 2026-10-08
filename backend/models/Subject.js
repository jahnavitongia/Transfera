const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
    {
        institution: { type: String, default: "Sample University B" },
        curriculumVersion: { type: String, default: "2026-demo" },
        topics: { type: String, default: "" },
        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        credits: {
            type: Number,
            required: true,
            min: 1
        },

        program: {
            type: String,
            required: true,
            trim: true
        },

        semester: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Subject", subjectSchema);