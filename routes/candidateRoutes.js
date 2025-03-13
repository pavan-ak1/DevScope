const express = require("express");
const { registerCandidate, getCandidates, approveCandidate, deleteCandidate } = require("../controllers/candidateController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, registerCandidate);  // ✅ Protected
router.get("/:electionId", authMiddleware, getCandidates);  // ✅ Protected
router.put("/:id", authMiddleware, approveCandidate);  // ✅ Protected
router.delete("/:id", authMiddleware, deleteCandidate);  // ✅ Protected

module.exports = router;
