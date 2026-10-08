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
router.use(protect, protect.allowRoles("staff", "admin"));

router.post("/", createTransfer);

router.get("/", getTransfers);

router.post(
    "/:transferId/evaluate",
    evaluateTransfer
);

router.get("/:id", getTransferById);

router.put("/:id/status", updateTransferStatus);

module.exports = router;