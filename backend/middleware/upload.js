const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Allowed extensions: pdf, txt, images, audio
    if (
      [
        ".pdf",
        ".docx",
        ".doc",
        ".pptx",
        ".ppt",
        ".txt",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".mp3",
        ".wav",
        ".m4a",
      ].includes(ext)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Only PDF, Word, PPT, TXT, image, and audio files allowed"),
        false
      );
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = upload;
