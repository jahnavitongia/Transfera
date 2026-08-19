const PreviousSubject = require("../models/PreviousSubject");
const Transfer = require("../models/Transfer");

// ==========================================
// ADD PREVIOUS SUBJECT
// ==========================================

const addPreviousSubject = async (req, res) => {
    try {
        const {
            transfer,
            code,
            name,
            credits,
            semester,
            grade
        } = req.body;

        if (
            !transfer ||
            !code ||
            !name ||
            !credits ||
            !semester
        ) {
            return res.status(400).json({
                message: "Required subject fields are missing"
            });
        }

        const existingTransfer =
            await Transfer.findById(transfer);

        if (!existingTransfer) {
            return res.status(404).json({
                message: "Transfer request not found"
            });
        }

        const subject =
            await PreviousSubject.create({
                transfer,
                code,
                name,
                credits,
                semester,
                grade
            });

        res.status(201).json({
            message: "Previous subject added successfully",
            subject
        });

    } catch (error) {
        console.error(
            "Add Previous Subject Error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET PREVIOUS SUBJECTS FOR TRANSFER
// ==========================================

const getPreviousSubjects = async (req, res) => {
    try {
        const subjects =
            await PreviousSubject.find({
                transfer: req.params.transferId
            })
            .sort({
                semester: 1,
                code: 1
            });

        res.status(200).json({
            count: subjects.length,
            subjects
        });

    } catch (error) {
        console.error(
            "Get Previous Subjects Error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    addPreviousSubject,
    getPreviousSubjects
};