const express = require("express");
const { registerCandidate, getCandidates, approveCandidate, deleteCandidate } = require("../controllers/candidateController");
const router = express.Router();

router.post("/", registerCandidate);
router.get("/:electionId", getCandidates);
router.patch("/:id", approveCandidate);
router.delete("/:id", deleteCandidate);

module.exports = router;
