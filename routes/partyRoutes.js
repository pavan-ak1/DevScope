const express = require("express");
const router = express.Router();
const { getParties, addParty, updateParty, deleteParty } = require("../controllers/partyController");

router.get("/", getParties);
router.post("/", addParty);
router.put("/:id", updateParty);
router.delete("/:id", deleteParty);

module.exports = router;
