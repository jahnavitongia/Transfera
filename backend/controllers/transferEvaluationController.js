const Transfer = require("../models/Transfer");
const PreviousSubject = require("../models/PreviousSubject");
const Subject = require("../models/Subject");
const SubjectMapping = require("../models/SubjectMapping");

const {
    calculateSimilarity,
    getMappingStatus
} = require("../services/subjectMapping");


// ==========================================
// EVALUATE TRANSFER
// ==========================================

const evaluateTransfer = async (req, res) => {
    try {

        const { transferId } = req.params;

        // --------------------------------------
        // 1. Find transfer
        // --------------------------------------

        const transfer =
            await Transfer.findById(transferId);

        if (!transfer) {
            return res.status(404).json({
                message: "Transfer request not found"
            });
        }

        // --------------------------------------
        // 2. Get previous subjects
        // --------------------------------------

        const previousSubjects =
            await PreviousSubject.find({
                transfer: transferId
            });

        if (previousSubjects.length === 0) {
            return res.status(400).json({
                message:
                    "No previous subjects found for this transfer"
            });
        }

        // --------------------------------------
        // 3. Get current curriculum
        // --------------------------------------

        const currentSubjects =
            await Subject.find();

        if (currentSubjects.length === 0) {
            return res.status(400).json({
                message:
                    "No current curriculum subjects found"
            });
        }

        // --------------------------------------
        // 4. Remove old mappings
        // --------------------------------------

        await SubjectMapping.deleteMany({
            transfer: transferId
        });

        const mappings = [];

        // --------------------------------------
        // 5. Compare every previous subject
        //    with every current subject
        // --------------------------------------

        for (const previousSubject of previousSubjects) {

            let bestMatch = null;

            for (const currentSubject of currentSubjects) {

                const similarity =
                    calculateSimilarity(
                        previousSubject.name,
                        currentSubject.name
                    );

                if (
                    !bestMatch ||
                    similarity >
                    bestMatch.similarity
                ) {
                    bestMatch = {
                        currentSubject,
                        similarity
                    };
                }
            }

            // ----------------------------------
            // Determine classification
            // ----------------------------------

            const mappingResult =
                getMappingStatus(
                    bestMatch.similarity
                );

            // ----------------------------------
            // Save mapping
            // ----------------------------------

            const mapping =
                await SubjectMapping.create({

                    transfer: transferId,

                    previousSubject: {
                        name: previousSubject.name,
                        code: previousSubject.code,
                        credits: previousSubject.credits
                    },

                    currentSubject:
                        bestMatch.currentSubject._id,

                    similarityPercentage:
                        bestMatch.similarity,

                    mappingStatus:
                        mappingResult.status,

                    recommendation:
                        mappingResult.recommendation
                });

            mappings.push(mapping);
        }

        // --------------------------------------
        // 6. Calculate statistics
        // --------------------------------------

        const total =
            mappings.length;

        const accepted =
            mappings.filter(
                mapping =>
                    mapping.recommendation ===
                    "accepted"
            ).length;

        const reviewRequired =
            mappings.filter(
                mapping =>
                    mapping.recommendation ===
                    "review_required"
            ).length;

        const repeatSubjects =
            mappings.filter(
                mapping =>
                    mapping.recommendation ===
                    "repeat_subject"
            ).length;

        // --------------------------------------
        // 7. Overall compatibility
        // --------------------------------------

        const totalSimilarity =
            mappings.reduce(
                (sum, mapping) =>
                    sum +
                    mapping.similarityPercentage,
                0
            );

        const overallCompatibility =
            total > 0
                ? Math.round(
                    totalSimilarity / total
                )
                : 0;

        // --------------------------------------
        // 8. Determine overall status
        // --------------------------------------

        let evaluationStatus =
            "approved";

        if (repeatSubjects > 0) {
            evaluationStatus =
                "review_required";
        }

        if (
            overallCompatibility < 50
        ) {
            evaluationStatus =
                "rejected";
        }

        // --------------------------------------
        // 9. Response
        // --------------------------------------

        res.status(200).json({

            message:
                "Transfer evaluated successfully",

            transferId,

            statistics: {

                totalPreviousSubjects:
                    total,

                acceptedSubjects:
                    accepted,

                reviewRequiredSubjects:
                    reviewRequired,

                subjectsToRepeat:
                    repeatSubjects,

                overallCompatibility:
                    overallCompatibility,

                evaluationStatus
            },

            mappings

        });

    } catch (error) {

        console.error(
            "Transfer Evaluation Error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    evaluateTransfer
};