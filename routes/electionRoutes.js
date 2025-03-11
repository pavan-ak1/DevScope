const express = require("express");
const {
    createElection,
    getElections,
    updateElection,
    deleteElection,
    getElectionStats,
    getElectionById
} = require("../controllers/electionController");

const router = express.Router();

// ✅ Fix route: Change `/create` to `/`
router.post("/", createElection); // POST /api/v1/elections/

// ✅ Fix route: Update GET request
router.get("/", getElections); // GET /api/v1/elections/

// ✅ Fix route: Update PUT request
router.put("/:id", updateElection); // PUT /api/v1/elections/:id

// ✅ Fix route: Update DELETE request
router.delete("/:id", deleteElection); // DELETE /api/v1/elections/:id

router.get("/stats", getElectionStats);
router.get("/:id", getElectionById);

module.exports = router;
