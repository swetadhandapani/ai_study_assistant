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

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// --------------------------
// 1️⃣ Serve uploads folder
// --------------------------
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------------------
// 2️⃣ API Routes
// --------------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/audio', require('./routes/audio'));

// --------------------------
// 3️⃣ Serve frontend build
// --------------------------
app.use(express.static(path.join(__dirname, 'public')));

// --------------------------
// 4️⃣ SPA Fallback (React Router)
// --------------------------
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// --------------------------
// 5️⃣ Start server
// --------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
