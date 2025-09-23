const mongoose = require("mongoose");

const audioNoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "Untitled Audio" },
    filePath: { type: String },
    fileUrl: { type: String },      
    transcription: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AudioNote", audioNoteSchema);
