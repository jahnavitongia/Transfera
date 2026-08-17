const mongoose = require("mongoose");

const subjectMappingSchema = new mongoose.Schema(
    {
        transfer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transfer",
            required: true
        },

        previousSubject: {
            name: {
                type: String,
                required: true
            },

            code: {
                type: String,
                trim: true
            },

            credits: {
                type: Number
            }
        },

        currentSubject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject"
        },

        similarityPercentage: {
            type: Number,
            required: true
        },

        mappingStatus: {
            type: String,
            enum: [
                "equivalent",
                "partial",
                "not_equivalent"
            ],
            required: true
        },

        recommendation: {
            type: String,
            enum: [
                "accepted",
                "review_required",
                "repeat_subject"
            ],
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "SubjectMapping",
    subjectMappingSchema
);