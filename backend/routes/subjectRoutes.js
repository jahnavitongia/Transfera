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
router.use(protect, protect.allowRoles("staff", "admin"));

router.post("/", addSubject);

router.get("/", getSubjects);

router.get("/:id", getSubjectById);

router.put("/:id", updateSubject);

router.delete("/:id", deleteSubject);

module.exports = router;