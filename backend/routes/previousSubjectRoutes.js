const express = require("express");

const {
    addPreviousSubject,
    getPreviousSubjects
} = require("../controllers/previousSubjectController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, protect.allowRoles("staff", "admin"));

router.post(
    "/",
    addPreviousSubject
);

router.get(
    "/transfer/:transferId",
    getPreviousSubjects
);

module.exports = router;