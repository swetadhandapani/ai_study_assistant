require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

connectDB();
const app = express();

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());

// ✅ Serve uploads folder with correct cache headers
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Disable caching for dynamic files like avatars/audio
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Force download for certain file types
    if (/\.(pdf|docx|xlsx|pptx)$/i.test(filePath)) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${path.basename(filePath)}"`
      );
    }
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/audio', require('./routes/audio'));

// ✅ Serve React frontend
app.use(express.static(path.join(__dirname, 'public')));

// ✅ SPA fallback (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
