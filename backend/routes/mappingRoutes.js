const express = require("express");

const {
    createMapping,
    getMappingsByTransfer
} = require("../controllers/mappingController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect, protect.allowRoles("staff", "admin"));

router.post("/", createMapping);

router.get(
    "/transfer/:transferId",
    getMappingsByTransfer
);

module.exports = router;