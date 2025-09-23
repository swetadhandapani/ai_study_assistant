const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generateMaterials,
  getStudyMaterial,
  askAboutNote,
  generateMindmap,
  generateMarkdown,
} = require("../controllers/aiController");

// Generate study materials (summary / flashcards / quiz / all)
router.post("/generate", protect, generateMaterials);

// Get existing study material for a note
router.get("/material/:noteId", protect, getStudyMaterial);

// Ask-AI chatbot about a note
router.post("/ask", protect, askAboutNote);

// Generate mind map
router.post("/mindmap/:noteId", protect, generateMindmap);

// Generate markdown content
router.post("/markdown/:noteId", protect, generateMarkdown);

module.exports = router;
