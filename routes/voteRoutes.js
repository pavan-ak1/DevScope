const express = require("express");
const { castVote, getVotes, getVoterTurnout } = require("../controllers/voteController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, castVote);  // ✅ Protected
router.get("/", authMiddleware, getVotes);  // ✅ Protected
router.get("/turnout/:electionId", authMiddleware, getVoterTurnout);  // ✅ Protected

module.exports = router;
