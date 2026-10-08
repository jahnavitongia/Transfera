const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { getProfile, saveProfile } = require("../controllers/profileController");
router.use(protect, protect.allowRoles("student"));
router.get("/", getProfile);
router.put("/", saveProfile);
module.exports = router;
