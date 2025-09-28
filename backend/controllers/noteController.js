const Note = require("../models/Note");
const StudyMaterial = require("../models/StudyMaterial");
const { extractTextFromPDF, extractTextFromDocx, extractTextFromPpt } = require("../utils/pdfParser");

// ✅ upload note with optional file
exports.uploadNote = async (req, res) => {
  try {
    const { title } = req.body;
    let text = req.body.text || "";
    let fileUrl = null;

    if (req.file) {
      const filePath = req.file.path;
      fileUrl = `/uploads/${req.file.filename}`; // ✅ always no /api

      try {
        if (filePath.endsWith(".pdf")) {
          text += "\n" + (await extractTextFromPDF(filePath));
        } else if (filePath.endsWith(".docx")) {
          text += "\n" + (await extractTextFromDocx(filePath));
        } else if (filePath.endsWith(".pptx")) {
          text += "\n" + (await extractTextFromPpt(filePath));
        }
      } catch (err) {
        console.error("Extraction failed:", err);
      }
    }

    const note = await Note.create({
      user: req.user._id,
      title: title || "Untitled",
      originalText: text || "",
      fileUrl,
    });

    const sm = await StudyMaterial.create({
      user: req.user._id,
      note: note._id,
      flashcards: [],
      summary: "",
    });

    res.status(201).json({ note, studyMaterial: sm });
  } catch (err) {
    console.error("Error in uploadNote:", err);
    res.status(500).json({ message: "Server error while uploading note" });
  }
};

// ✅ update note
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: "Note not found" });

    let text = req.body.text || note.originalText;

    if (req.file) {
      const filePath = req.file.path;
      note.fileUrl = `/uploads/${req.file.filename}`; // ✅ fixed (no "api")

      try {
        if (filePath.endsWith(".pdf")) {
          text += "\n" + (await extractTextFromPDF(filePath));
        } else if (filePath.endsWith(".docx")) {
          text += "\n" + (await extractTextFromDocx(filePath));
        } else if (filePath.endsWith(".pptx")) {
          text += "\n" + (await extractTextFromPpt(filePath));
        }
      } catch (err) {
        console.error("Extraction failed:", err);
      }
    }

    note.title = req.body.title || note.title;
    note.originalText = text;
    await note.save();

    res.json(note);
  } catch (err) {
    console.error("Error in updateNote:", err);
    res.status(500).json({ message: "Server error while updating note" });
  }
};


// ✅ get all notes
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(notes);
  } catch (err) {
    console.error("Error in getNotes:", err);
    res.status(500).json({ message: "Server error while fetching notes" });
  }
};

// ✅ get note by id
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (err) {
    console.error("Error in getNoteById:", err);
    res.status(500).json({ message: "Server error while fetching note" });
  }
};


// ✅ delete note
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: "Note not found" });

    await StudyMaterial.deleteOne({ note: note._id, user: req.user._id });
    await note.deleteOne();

    res.json({
      message: "Note and linked study material deleted successfully",
    });
  } catch (err) {
    console.error("Error in deleteNote:", err);
    res.status(500).json({ message: "Server error while deleting note" });
  }
};
