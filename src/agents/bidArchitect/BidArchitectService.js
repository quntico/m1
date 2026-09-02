const { AIConnector } = require('../../connectors/ai/AIConnector');
const { BID_ARCHITECT_SYSTEM_PROMPT } = require('./BidArchitectPrompt');
const DocumentAnalyzer = require('./DocumentAnalyzer');

class BidArchitectService {
    async handleChat(message, { contextId, contextType }) {
        let contextualPrompt = BID_ARCHITECT_SYSTEM_PROMPT;

        if (contextType === "criterion") {
            contextualPrompt += `\nESTÁS ANALIZANDO EL CRITERIO OFICIAL CON ID: ${contextId}`;
        }

        const reply = await AIConnector.generateText(contextualPrompt, message);
        return reply;
    }

    async analyzeDocument(filePath, originalName) {
        // FASE 1: Extract basic info, classify and suggest folder.
        // Usually we'd extract text from PDF using pdf-parse here.
        // Since we are mocking the extraction for Phase 1 if pdf parsing is heavy, we'll read text if txt, or simulate.

        const extractedText = await DocumentAnalyzer.extractText(filePath, originalName);

        const analysisPrompt = `Adicional a tu formato estándar, por favor inicia tu respuesta evaluando la naturaleza de este documento:
1. CLASIFICACIÓN (Ej. CONTRATO, CARTA, CV, etc o REQUIERE VALIDACIÓN)
2. CARPETA SUGERIDA (official, administrative, technical, financial, contracts, personnel, oem, evidence)
3. RESUMEN BREVE

Luego proporciona tu desglose estándar (CONCLUSIÓN, FUENTE, etc).`;

        const analysis = await AIConnector.analyzeDocumentText(BID_ARCHITECT_SYSTEM_PROMPT, extractedText, analysisPrompt);
        return analysis;
    }
}

module.exports = { BidArchitectService: new BidArchitectService() };
