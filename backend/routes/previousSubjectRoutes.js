const express = require("express");

const {
    addPreviousSubject,
    getPreviousSubjects
} = require("../controllers/previousSubjectController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    protect,
    addPreviousSubject
);

router.get(
    "/transfer/:transferId",
    protect,
    getPreviousSubjects
);

module.exports = router;