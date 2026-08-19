const mongoose = require("mongoose");

const previousSubjectSchema = new mongoose.Schema(
    {
        transfer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transfer",
            required: true
        },

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

        semester: {
            type: Number,
            required: true
        },

        grade: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "PreviousSubject",
    previousSubjectSchema
);