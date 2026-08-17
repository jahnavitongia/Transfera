const Transfer = require("../models/Transfer");
const Student = require("../models/Student");

// ==========================================
// CREATE TRANSFER REQUEST
// ==========================================

const createTransfer = async (req, res) => {
    try {
        const {
            student,
            previousInstitution,
            previousProgram,
            previousYear,
            currentProgram,
            transferReason
        } = req.body;

        if (
            !student ||
            !previousInstitution ||
            !previousProgram ||
            !previousYear ||
            !currentProgram
        ) {
            return res.status(400).json({
                message: "Required transfer fields are missing"
            });
        }

        // Check whether student exists
        const existingStudent = await Student.findById(student);

        if (!existingStudent) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Create transfer
        const transfer = await Transfer.create({
            student,
            previousInstitution,
            previousProgram,
            previousYear,
            currentProgram,
            transferReason,
            processedBy: req.user.id
        });

        // Update student's transfer status
        existingStudent.admissionStatus = "transferred";
        existingStudent.transferStatus = "pending";

        await existingStudent.save();

        res.status(201).json({
            message: "Transfer request created successfully",
            transfer
        });

    } catch (error) {
        console.error("Create Transfer Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET ALL TRANSFERS
// ==========================================

const getTransfers = async (req, res) => {
    try {
        const transfers = await Transfer.find()
            .populate(
                "student",
                "studentId name email currentProgram"
            )
            .populate(
                "processedBy",
                "name email role"
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: transfers.length,
            transfers
        });

    } catch (error) {
        console.error("Get Transfers Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET SINGLE TRANSFER
// ==========================================

const getTransferById = async (req, res) => {
    try {
        const transfer = await Transfer.findById(
            req.params.id
        )
            .populate(
                "student",
                "studentId name email currentProgram"
            )
            .populate(
                "processedBy",
                "name email role"
            );

        if (!transfer) {
            return res.status(404).json({
                message: "Transfer request not found"
            });
        }

        res.status(200).json({
            transfer
        });

    } catch (error) {
        console.error("Get Transfer Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// UPDATE TRANSFER STATUS
// ==========================================

const updateTransferStatus = async (req, res) => {
    try {
        const {
            status,
            remarks
        } = req.body;

        const allowedStatuses = [
            "pending",
            "under_review",
            "approved",
            "rejected"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid transfer status"
            });
        }

        const transfer = await Transfer.findByIdAndUpdate(
            req.params.id,
            {
                status,
                remarks,
                processedBy: req.user.id
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!transfer) {
            return res.status(404).json({
                message: "Transfer request not found"
            });
        }

        res.status(200).json({
            message: "Transfer status updated successfully",
            transfer
        });

    } catch (error) {
        console.error(
            "Update Transfer Status Error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    createTransfer,
    getTransfers,
    getTransferById,
    updateTransferStatus
};