const fs = require("fs");
const path = require("path");
const AudioNote = require("../models/AudioNote");
const { Groq } = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ✅ Helper → always build public file URL
const buildFileUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/api/uploads/${filename}`;
};

// ✅ Upload + transcribe audio (initial upload)
exports.uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-large-v3",
    });

    const filename = req.file.filename;

    const audioNote = new AudioNote({
      user: req.user._id,
      title: req.body.title || "Untitled Audio",
      filePath: filename, // just filename
      fileUrl: buildFileUrl(req, filename),
      transcription: transcription.text,
    });

    await audioNote.save();

    res.json(audioNote.toObject());
  } catch (err) {
    console.error("Error in uploadAudio:", err);
    res.status(500).json({ message: "Server error while uploading audio" });
  }
};

// ✅ Get all audio notes
exports.getAudios = async (req, res) => {
  try {
    const audios = await AudioNote.find({ user: req.user._id }).sort({ createdAt: -1 });
    const transformed = audios.map((a) => {
      const obj = a.toObject();
      obj.fileUrl = buildFileUrl(req, obj.filePath);
      return obj;
    });
    res.json(transformed);
  } catch (err) {
    console.error("Error fetching audios:", err);
    res.status(500).json({ message: "Server error while fetching audios" });
  }
};

// ✅ Get one audio note
exports.getAudio = async (req, res) => {
  try {
    const audio = await AudioNote.findById(req.params.id);
    if (!audio) return res.status(404).json({ message: "Not found" });

    const obj = audio.toObject();
    obj.fileUrl = buildFileUrl(req, obj.filePath);
    res.json(obj);
  } catch (err) {
    console.error("Error in getAudio:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update title and optionally replace audio file
exports.updateAudio = async (req, res) => {
  try {
    const audio = await AudioNote.findById(req.params.id);
    if (!audio) return res.status(404).json({ message: "Not found" });

    if (audio.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (req.body.title) audio.title = req.body.title;

    if (req.file) {
      // remove old file if it exists
      if (audio.filePath) {
        const oldPath = path.join(__dirname, "..", "uploads", audio.filePath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      const filename = req.file.filename;
      audio.filePath = filename;
      audio.fileUrl = buildFileUrl(req, filename);

      try {
        const transcription = await groq.audio.transcriptions.create({
          file: fs.createReadStream(req.file.path),
          model: "whisper-large-v3",
        });
        audio.transcription = transcription.text;
      } catch (err) {
        console.error("Error re-transcribing:", err.message);
        audio.transcription = audio.transcription || "";
      }
    }

    await audio.save();

    const obj = audio.toObject();
    obj.fileUrl = buildFileUrl(req, obj.filePath);

    res.json(obj);
  } catch (err) {
    console.error("Error in updateAudio:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete audio note + file cleanup
exports.deleteAudio = async (req, res) => {
  try {
    const audio = await AudioNote.findById(req.params.id);
    if (!audio) {
      return res.status(404).json({ message: "Audio note not found" });
    }

    if (audio.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // remove physical file
    if (audio.filePath) {
      const filePath = path.join(__dirname, "..", "uploads", audio.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await audio.deleteOne();
    res.json({ message: "Audio note deleted" });
  } catch (err) {
    console.error("Error deleting audio:", err);
    res.status(500).json({ message: "Server error deleting audio" });
  }
};

// ✅ Translate transcript into target language
exports.translateTranscript = async (req, res) => {
  try {
    const { transcript, targetLang = "es" } = req.body;
    if (!transcript) {
      return res.status(400).json({ message: "Transcript required" });
    }

    const translation = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: `Translate this text into ${targetLang}` },
        { role: "user", content: transcript },
      ],
    });

    res.json({ translated: translation.choices[0].message.content });
  } catch (err) {
    console.error("Translation error:", err.response?.data || err.message);
    res.status(500).json({ message: "Error translating transcript" });
  }
};
