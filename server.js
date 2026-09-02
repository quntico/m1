require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { BidArchitectService } = require('./src/agents/bidArchitect/BidArchitectService');

const app = express();
app.use(cors());
app.use(express.json());

// For file uploads
const uploadDirectory = path.join(__dirname, 'data', 'projects', 'M1', 'documents');
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDirectory),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// API Endpoints
app.post('/api/chat', async (req, res) => {
    try {
        const { message, contextId, contextType } = req.body;
        const response = await BidArchitectService.handleChat(message, { contextId, contextType });
        res.json({ reply: response });
    } catch (err) {
        console.error("Chat error", err);
        res.status(500).json({ error: "Failed to process chat request." });
    }
});

app.post('/api/documents', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file provided" });
        const analysis = await BidArchitectService.analyzeDocument(req.file.path, req.file.originalname);
        res.json({ success: true, file: req.file.filename, analysis });
    } catch (err) {
        console.error("Upload error", err);
        res.status(500).json({ error: "Failed to process uploaded document." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Bid Architect Secure Local Service running on port ${PORT}`);
});
