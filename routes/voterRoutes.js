const express = require("express");
const {
    verifyVoter,
    getPendingVoters,
    detectDuplicateVoters,
    deleteVoter,
    approveVoter,  // ✅ Ensure imported
    rejectVoter    // ✅ Ensure imported
} = require("../controllers/voterController");

const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/verify", authMiddleware, verifyVoter);  // ✅ Protected
router.get("/pending", authMiddleware, getPendingVoters);  // ✅ Protected
router.get("/duplicates", authMiddleware, detectDuplicateVoters);  // ✅ Protected
router.delete("/:id", authMiddleware, deleteVoter);  // ✅ Ensure ID is present in the route

// ✅ Fix Approve/Reject Routes
router.put("/approve/:id", authMiddleware, approveVoter);
router.put("/reject/:id", authMiddleware, rejectVoter);

module.exports = router;
