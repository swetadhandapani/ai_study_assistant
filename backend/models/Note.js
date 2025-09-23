const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    originalText: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String, // for uploaded file path
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
