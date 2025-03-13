const express = require("express");
const router = express.Router();
const { getParties, addParty, updateParty, deleteParty } = require("../controllers/partyController");
const { authMiddleware } = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// ✅ Configure Multer to Upload to Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "party-logos",
        format: async (req, file) => "png",
        public_id: (req, file) => file.originalname.split(".")[0],
    },
});

const upload = multer({ storage: storage });

// ✅ Protect Routes
router.get("/", authMiddleware, getParties);
router.post("/", authMiddleware, upload.single("logo"), addParty);
router.put("/:id", authMiddleware, upload.single("logo"), updateParty);
router.delete("/:id", authMiddleware, deleteParty);

module.exports = router;
