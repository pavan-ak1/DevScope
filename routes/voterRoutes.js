const express = require("express");
const { verifyVoter, approveRejectVoter, getPendingVoters, detectDuplicateVoters, deleteVoter } = require("../controllers/voterController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/verify", authMiddleware, verifyVoter);  // ✅ Protected
router.put("/approve-reject", authMiddleware, approveRejectVoter);  // ✅ Protected
router.get("/pending", authMiddleware, getPendingVoters);  // ✅ Protected
router.get("/duplicates", authMiddleware, detectDuplicateVoters);  // ✅ Protected
router.delete("/:id", authMiddleware, deleteVoter);  // ✅ Ensure ID is present in the route

module.exports = router;
