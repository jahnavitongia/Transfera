const {
    evaluateTransfer
} = require(
    "../controllers/transferEvaluationController"
);

const express = require("express");

const {
    createTransfer,
    getTransfers,
    getTransferById,
    updateTransferStatus
} = require("../controllers/transferController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createTransfer);

router.get("/", protect, getTransfers);

router.post(
    "/:transferId/evaluate",
    protect,
    evaluateTransfer
);

router.get("/:id", protect, getTransferById);

router.put("/:id/status", protect, updateTransferStatus);

module.exports = router;