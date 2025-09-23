const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
    },
    audio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AudioNote',   
    },
    summaries: [String],   
    flashcards: [
      {
        question: String,  
        answer: String,
      },
    ],
    quizzes: [
      {
        question: String,
        options: [String],
        answerIndex: Number,
      },
    ],
    mindmap: {
      topic: String,
      subtopics: [
        {
          topic: String,
          subtopics: [
            {
              topic: String,
            },
          ],
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
