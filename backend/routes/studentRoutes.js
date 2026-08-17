const express = require("express");

const {
    addStudent,
    getStudents,
    getStudentById,
    updateStudent
} = require("../controllers/studentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// All student routes are protected
router.post("/", protect, addStudent);

router.get("/", protect, getStudents);

router.get("/:id", protect, getStudentById);

router.put("/:id", protect, updateStudent);

module.exports = router;