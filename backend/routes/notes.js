const express = require('express');
const router = express.Router();
const {
  uploadNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// upload new note (with optional PDF/TXT/Image)
router.post('/upload', protect, upload.single('file'), uploadNote);

// get all notes
router.get('/', protect, getNotes);

// get one note
router.get('/:id', protect, getNoteById);

// update a note
router.put('/:id', protect, upload.single('file'), updateNote);

// delete a note
router.delete('/:id', protect, deleteNote);

module.exports = router;
