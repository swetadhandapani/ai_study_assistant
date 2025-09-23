const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  uploadAudio,
  getAudios,
  deleteAudio,
  translateTranscript,
  getAudio,
  updateAudio,
} = require("../controllers/audioController");

router.post("/transcribe", protect, upload.single("audio"), uploadAudio);
router.get("/", protect, getAudios);
router.get("/:id", protect, getAudio);
router.put("/:id", protect, upload.single("audio"), updateAudio);
router.delete("/:id", protect, deleteAudio);
router.post("/translate", protect, translateTranscript);

module.exports = router;
