const express = require("express");

const {
    addSubject,
    getSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject
} = require("../controllers/subjectController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, addSubject);

router.get("/", protect, getSubjects);

router.get("/:id", protect, getSubjectById);

router.put("/:id", protect, updateSubject);

router.delete("/:id", protect, deleteSubject);

module.exports = router;