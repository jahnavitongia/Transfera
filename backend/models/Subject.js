const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
    {
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
            required: true
        },

        program: {
            type: String,
            required: true,
            trim: true
        },

        semester: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Subject", subjectSchema);