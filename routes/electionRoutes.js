const express = require("express");
const { createElection, getElections, updateElection, deleteElection, getElectionStats, getElectionById } = require("../controllers/electionController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createElection);  // ✅ Protected
router.get("/", authMiddleware, getElections);  // ✅ Protected
router.put("/:id", authMiddleware, updateElection);  // ✅ Protected
router.delete("/:id", authMiddleware, deleteElection);  // ✅ Protected
router.get("/stats", authMiddleware, getElectionStats);  // ✅ Protected
router.get("/:id", authMiddleware, getElectionById);  // ✅ Protected

module.exports = router;
