require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { BidArchitectService } = require('./src/agents/bidArchitect/BidArchitectService');

const app = express();

// Strict CORS
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

// Directories
const projectBasePath = path.join(__dirname, 'data', 'projects', 'M1');
const uploadDirectory = path.join(projectBasePath, 'documents');
const agentMemoryPath = path.join(projectBasePath, 'agent');
const backupPath = path.join(projectBasePath, 'backups');
const evidencePath = path.join(projectBasePath, 'evidence');
const contractsPath = path.join(projectBasePath, 'contracts');
const personnelPath = path.join(projectBasePath, 'personnel');
const oemPath = path.join(projectBasePath, 'oem');
const financialPath = path.join(projectBasePath, 'financial');
const scenariosPath = path.join(projectBasePath, 'scenarios');
const exportsPath = path.join(projectBasePath, 'exports');

[uploadDirectory, agentMemoryPath, backupPath, evidencePath, contractsPath, personnelPath, oemPath, financialPath, scenariosPath, exportsPath].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// History File
const historyFile = path.join(agentMemoryPath, 'conversations.json');
if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(historyFile, JSON.stringify([]), 'utf-8');
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
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'bid-architect' });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, contextId, contextType } = req.body;

        // Log user message
        const currentHist = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
        const userMsg = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            role: 'user',
            content: message,
            projectId: 'M1',
            contextType: contextType || null,
            contextId: contextId || null
        };
        currentHist.push(userMsg);

        const response = await BidArchitectService.handleChat(message, { contextId, contextType });

        const aiMsg = {
            id: (Date.now() + 1).toString(),
            timestamp: new Date().toISOString(),
            role: 'assistant',
            content: response,
            projectId: 'M1',
            contextType: contextType || null,
            contextId: contextId || null
        };
        currentHist.push(aiMsg);

        // Persist
        fs.writeFileSync(historyFile, JSON.stringify(currentHist, null, 2), 'utf-8');

        res.json({ reply: response });
    } catch (err) {
        console.error("Chat error", err);
        res.status(500).json({ error: "Failed to process chat request." });
    }
});

app.get('/api/chat/history', (req, res) => {
    try {
        const currentHist = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
        res.json(currentHist);
    } catch (err) {
        res.status(500).json({ error: "Failed to read history." });
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
    const isAiConfigured = !!process.env.OPENAI_API_KEY;
    console.log(`
==================================================
M1 PRECALIFICACIÓN ENGINE
Frontend: http://localhost:3000
Bid Architect API: http://localhost:${PORT}
AI: ${isAiConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}
Project data: ./data/projects/M1
==================================================
`);
});
