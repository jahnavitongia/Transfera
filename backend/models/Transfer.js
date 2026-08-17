const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },

        previousInstitution: {
            type: String,
            required: true,
            trim: true
        },

        previousProgram: {
            type: String,
            required: true,
            trim: true
        },

        previousYear: {
            type: Number,
            required: true
        },

        currentProgram: {
            type: String,
            required: true,
            trim: true
        },

        transferReason: {
            type: String,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "under_review",
                "approved",
                "rejected"
            ],
            default: "pending"
        },

        remarks: {
            type: String,
            trim: true
        },

        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Transfer", transferSchema);