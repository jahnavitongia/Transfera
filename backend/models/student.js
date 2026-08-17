const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            trim: true
        },

        previousInstitution: {
            type: String,
            trim: true
        },

        previousProgram: {
            type: String,
            trim: true
        },

        currentProgram: {
            type: String,
            required: true,
            trim: true
        },

        admissionYear: {
            type: Number,
            required: true
        },

        admissionStatus: {
            type: String,
            enum: [
                "active",
                "transferred",
                "cancelled"
            ],
            default: "active"
        },

        transferStatus: {
            type: String,
            enum: [
                "not_applicable",
                "pending",
                "completed"
            ],
            default: "not_applicable"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Student", studentSchema);