const SubjectMapping = require("../models/SubjectMapping");
const Transfer = require("../models/Transfer");
const Subject = require("../models/Subject");

const {
    calculateSimilarity,
    getMappingStatus
} = require("../services/subjectMapping");

// ==========================================
// CREATE SUBJECT MAPPING
// ==========================================

const createMapping = async (req, res) => {
    try {
        const {
            transfer,
            previousSubjectName,
            previousSubjectCode,
            previousCredits,
            currentSubject
        } = req.body;

        if (
            !transfer ||
            !previousSubjectName ||
            !currentSubject
        ) {
            return res.status(400).json({
                message: "Required mapping fields are missing"
            });
        }

        // Check transfer
        const existingTransfer =
            await Transfer.findById(transfer);

        if (!existingTransfer) {
            return res.status(404).json({
                message: "Transfer request not found"
            });
        }

        // Check current subject
        const existingSubject =
            await Subject.findById(currentSubject);

        if (!existingSubject) {
            return res.status(404).json({
                message: "Current subject not found"
            });
        }

        // Calculate similarity
        const similarity =
            calculateSimilarity(
                previousSubjectName,
                existingSubject.name
            );

        // Determine result
        const mappingResult =
            getMappingStatus(similarity);

        // Save mapping
        const mapping =
            await SubjectMapping.create({
                transfer,
                previousSubject: {
                    name: previousSubjectName,
                    code: previousSubjectCode,
                    credits: previousCredits
                },
                currentSubject,
                similarityPercentage: similarity,
                mappingStatus: mappingResult.status,
                recommendation:
                    mappingResult.recommendation
            });

        res.status(201).json({
            message: "Subject mapping created successfully",
            mapping
        });

    } catch (error) {
        console.error(
            "Create Mapping Error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET MAPPINGS FOR TRANSFER
// ==========================================

const getMappingsByTransfer = async (req, res) => {
    try {
        const mappings =
            await SubjectMapping.find({
                transfer: req.params.transferId
            })
            .populate(
                "currentSubject",
                "code name credits program semester"
            )
            .sort({
                similarityPercentage: -1
            });

        res.status(200).json({
            count: mappings.length,
            mappings
        });

    } catch (error) {
        console.error(
            "Get Mappings Error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    createMapping,
    getMappingsByTransfer
};