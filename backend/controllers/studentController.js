const Student = require("../models/student");
const withStudentStatus = require("../services/studentStatus");

// ==========================================
// ADD STUDENT
// ==========================================

const addStudent = async (req, res) => {
    try {
        const {
            studentId,
            name,
            email,
            phone,
            previousInstitution,
            previousProgram,
            currentProgram,
            admissionYear,
            admissionStatus,
            transferStatus
        } = req.body;

        if (
            !studentId ||
            !name ||
            !email ||
            !currentProgram ||
            !admissionYear
        ) {
            return res.status(400).json({
                message: "Required student fields are missing"
            });
        }

        const existingStudent = await Student.findOne({
            studentId
        });

        if (existingStudent) {
            return res.status(400).json({
                message: "Student with this ID already exists"
            });
        }

        const student = await Student.create({
            studentId,
            name,
            email,
            phone,
            previousInstitution,
            previousProgram,
            currentProgram,
            admissionYear,
            admissionStatus: admissionStatus || "active",
            transferStatus:
                transferStatus || "not_applicable"
        });

        res.status(201).json({
            message: "Student added successfully",
            student: (await withStudentStatus([student]))[0]
        });

    } catch (error) {
        console.error("Add Student Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET ALL STUDENTS
// ==========================================

const getStudents = async (req, res) => {
    try {
        const students = await Student.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: students.length,
            students: await withStudentStatus(students)
        });

    } catch (error) {
        console.error("Get Students Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// GET SINGLE STUDENT
// ==========================================

const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(
            req.params.id
        );

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json({
            student: (await withStudentStatus([student]))[0]
        });

    } catch (error) {
        console.error("Get Student Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// ==========================================
// UPDATE STUDENT
// ==========================================

const updateStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            Object.fromEntries(Object.entries(req.body).filter(([key]) => ["name", "email", "phone", "previousInstitution", "previousProgram", "admissionYear"].includes(key))),
            {
                new: true,
                runValidators: true
            }
        );

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.status(200).json({
            message: "Student updated successfully",
            student: (await withStudentStatus([student]))[0]
        });

    } catch (error) {
        console.error("Update Student Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    addStudent,
    getStudents,
    getStudentById,
    updateStudent
};