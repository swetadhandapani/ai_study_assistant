require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// ensure uploads directory exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

connectDB();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ serve uploads folder so frontend can access file previews
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/audio', require('./routes/audio'));

//app.get('/', (req, res) => res.send('AI Study Assistant backend running'));

// ✅ Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));

// ✅ SPA Fallback (React Router)
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
