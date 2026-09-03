require('dotenv').config();
const express = require('express');
const { pool, query } = require('./src/db/neon'); // Starts the serverless Postgres connection pool
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Boot: load persisted config before anything else
const _bootConfigPath = path.join(__dirname, 'data', 'projects', 'M1', 'config.json');
if (fs.existsSync(_bootConfigPath)) {
    try {
        const _bootCfg = JSON.parse(fs.readFileSync(_bootConfigPath, 'utf-8'));
        if (_bootCfg.apiKey && _bootCfg.apiKey.startsWith('sk-')) {
            process.env.OPENAI_API_KEY = _bootCfg.apiKey;
            console.log('[M1] API Key cargada desde config persistente.');
        }
    } catch (e) { }
}

const { BidArchitectService } = require('./src/agents/bidArchitect/BidArchitectService');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '10mb' }));

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

// Persistent config file
const configFile = path.join(projectBasePath, 'config.json');
if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, JSON.stringify({ apiKey: '' }), 'utf-8');
}
const getConfig = () => { try { return JSON.parse(fs.readFileSync(configFile, 'utf-8')); } catch (e) { return {}; } };
const saveConfig = (cfg) => fs.writeFileSync(configFile, JSON.stringify(cfg, null, 2), 'utf-8');

app.get('/api/config', (req, res) => {
    const cfg = getConfig();
    // Never expose key directly – just confirm if one is set
    res.json({ hasApiKey: !!(cfg.apiKey && cfg.apiKey.startsWith('sk-')) });
});

app.post('/api/config', (req, res) => {
    try {
        const { apiKey } = req.body;
        const cfg = getConfig();
        if (apiKey !== undefined) cfg.apiKey = apiKey;
        saveConfig(cfg);
        // Inject into process.env for the current session
        if (apiKey) process.env.OPENAI_API_KEY = apiKey;
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save config' });
    }
});

// Branding Endpoints (persist in server)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.post('/api/branding', (req, res) => {
    try {
        const { type, dataUrl } = req.body;
        if (!type || !dataUrl) return res.status(400).json({ error: 'Missing type or dataUrl' });

        const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches) return res.status(400).json({ error: 'Invalid data format' });

        const buffer = Buffer.from(matches[2], 'base64');
        const ext = matches[1].includes('png') ? 'png' : matches[1].includes('svg') ? 'svg' : 'png';

        const filename = (type === 'logo-light' ? 'logo-light' : type === 'logo-dark' ? 'logo-dark' : 'favicon') + `.${ext}`;
        const filePath = path.join(__dirname, 'assets', filename);

        fs.writeFileSync(filePath, buffer);

        res.json({ ok: true, url: `assets/${filename}?t=${Date.now()}` });
    } catch (err) {
        console.error('Branding Save Error:', err);
        res.status(500).json({ error: 'Failed to save branding asset' });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, contextId, contextType, clientApiKey } = req.body;
        const msgId = Date.now().toString();
        const timestamp = new Date().toISOString();

        // 1. Insert User Message
        await query(
            'INSERT INTO agent_memory (id, timestamp, role, content, project_id, context_type, context_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [msgId, timestamp, 'user', message, 'M1', contextType || null, contextId || null]
        );

        // 2. Generate AI Response
        const response = await BidArchitectService.handleChat(message, { contextId, contextType, clientApiKey });

        // 3. Insert AI Response
        const aiMsgId = (Date.now() + 1).toString();
        const aiTimestamp = new Date().toISOString();
        await query(
            'INSERT INTO agent_memory (id, timestamp, role, content, project_id, context_type, context_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [aiMsgId, aiTimestamp, 'assistant', response, 'M1', contextType || null, contextId || null]
        );

        res.json({ reply: response });
    } catch (err) {
        console.error("Chat error", err);
        res.status(500).json({ error: "Failed to process chat request." });
    }
});

app.get('/api/chat/history', async (req, res) => {
    try {
        const result = await query(
            'SELECT id, timestamp, role, content, project_id AS "projectId", context_type AS "contextType", context_id AS "contextId" FROM agent_memory WHERE project_id = $1 ORDER BY timestamp ASC',
            ['M1']
        );
        res.json(result.rows);
    } catch (err) {
        console.error("History error", err);
        res.status(500).json({ error: "Failed to read history." });
    }
});

app.post('/api/documents', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file provided" });
        const { clientApiKey } = req.body;
        const analysis = await BidArchitectService.analyzeDocument(req.file.path, req.file.originalname, clientApiKey);
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
