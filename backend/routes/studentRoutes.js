const express = require("express");

const {
    addStudent,
    getStudents,
    getStudentById,
    updateStudent
} = require("../controllers/studentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, protect.allowRoles("staff", "admin"));

// All student routes are protected
router.post("/", addStudent);

router.get("/", getStudents);

router.get("/:id", getStudentById);

router.put("/:id", updateStudent);

module.exports = router;