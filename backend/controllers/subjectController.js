const Subject = require("../models/Subject");

// ==========================================
// ADD SUBJECT
// ==========================================

const addSubject = async (req, res) => {
    try {
        const {
            code,
            name,
            credits,
            program,
            semester
        } = req.body;

        if (
            !code ||
            !name ||
            !credits ||
            !program ||
            !semester
        ) {
            return res.status(400).json({
                message: "Required subject fields are missing"
            });
        }

        const existingSubject = await Subject.findOne({
            code: code.toUpperCase()
        });

        if (existingSubject) {
            return res.status(400).json({
                message: "Subject with this code already exists"
            });
        }

        const subject = await Subject.create({
            code,
            name,
            credits,
            program,
            semester
        });

        res.status(201).json({
            message: "Subject added successfully",
            subject
        });

    } catch (error) {
        console.error("Add Subject Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET ALL SUBJECTS
// ==========================================

const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find()
            .sort({
                semester: 1,
                code: 1
            });

        res.status(200).json({
            count: subjects.length,
            subjects
        });

    } catch (error) {
        console.error("Get Subjects Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET SINGLE SUBJECT
// ==========================================

const getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(
            req.params.id
        );

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        res.status(200).json({
            subject
        });

    } catch (error) {
        console.error("Get Subject Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// UPDATE SUBJECT
// ==========================================

const updateSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        res.status(200).json({
            message: "Subject updated successfully",
            subject
        });

    } catch (error) {
        console.error("Update Subject Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// DELETE SUBJECT
// ==========================================

const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(
            req.params.id
        );

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        res.status(200).json({
            message: "Subject deleted successfully"
        });

    } catch (error) {
        console.error("Delete Subject Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    addSubject,
    getSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject
};