const express = require("express");
const { castVote, getVotes, getVoterTurnout, getLiveVoteCount,
    getVoteDistributionByRegion,
    getElectionResults } = require("../controllers/voteController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, castVote);  // ✅ Protected
router.get("/", authMiddleware, getVotes);  // ✅ Protected
router.get("/turnout/:electionId", authMiddleware, getVoterTurnout);  // ✅ Protected
router.get("/live/:electionId", authMiddleware, getLiveVoteCount);  // ✅ Live Vote Count
router.get("/distribution/:electionId", authMiddleware, getVoteDistributionByRegion);  // ✅ Vote Distribution
router.get("/results/:electionId", authMiddleware, getElectionResults);  // ✅ Election Results
module.exports = router;
