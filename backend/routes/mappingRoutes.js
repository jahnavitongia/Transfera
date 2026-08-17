const express = require("express");

const {
    createMapping,
    getMappingsByTransfer
} = require("../controllers/mappingController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createMapping);

router.get(
    "/transfer/:transferId",
    protect,
    getMappingsByTransfer
);

module.exports = router;