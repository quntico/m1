const { OpenAI } = require('openai');

class AIConnector {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || "dummy-key-to-prevent-crash";
        if (!process.env.OPENAI_API_KEY) {
            console.warn("WARNING: OPENAI_API_KEY is not set. AI Features will run in DEMO MODE.");
        }
        this.openai = new OpenAI({ apiKey: this.apiKey });
    }

    _buildClient(clientApiKey) {
        return clientApiKey ? new OpenAI({ apiKey: clientApiKey }) : this.openai;
    }

    _activeKey(clientApiKey) {
        return clientApiKey || this.apiKey;
    }

    _demoCheck(clientApiKey) {
        return this._activeKey(clientApiKey) === "dummy-key-to-prevent-crash";
    }

    // ── Inject current date/time into every system prompt ──────────────
    _enrichPrompt(systemPrompt) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        return `${systemPrompt}\n\nFECHA Y HORA ACTUAL: ${dateStr} — ${timeStr} (hora local del sistema).\nTienes acceso a búsqueda web en tiempo real. Úsalo cuando el usuario necesite datos actuales, noticias, normativas vigentes o cualquier información que requiera estar al día.`;
    }

    // ── Responses API with web_search_preview (real-time internet) ─────
    async _generateWithSearch(client, systemPrompt, userPrompt) {
        try {
            const response = await client.responses.create({
                model: "gpt-4o-search-preview",
                tools: [{ type: "web_search_preview" }],
                instructions: systemPrompt,
                input: userPrompt,
            });
            // Extract text output from the response
            const textItem = (response.output || []).find(o => o.type === 'message');
            if (textItem && textItem.content) {
                const textContent = textItem.content.find(c => c.type === 'output_text');
                if (textContent) return textContent.text;
            }
            return response.output_text || "REQUIERE VALIDACIÓN: La respuesta del modelo no contenía texto.";
        } catch (err) {
            // Fallback to standard gpt-4o if responses API fails
            console.warn("web_search_preview failed, falling back to gpt-4o:", err.message);
            return this._generateFallback(client, systemPrompt, userPrompt);
        }
    }

    // ── Standard chat completion fallback ──────────────────────────────
    async _generateFallback(client, systemPrompt, userPrompt) {
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.2
        });
        return response.choices[0].message.content;
    }

    // ── Public Methods ─────────────────────────────────────────────────
    async generateText(systemPrompt, userPrompt, clientApiKey) {
        if (this._demoCheck(clientApiKey)) {
            return "MODO DEMO OFFLINE: No hay API Key válida configurada.\n\nACCIÓN RECOMENDADA:\nVe a Administración ⚙️ → tab API / IA, ingresa tu llave 'sk-...' y haz clic en 💾 Guardar API Key para habilitar inferencia real con acceso a internet.";
        }
        try {
            const client = this._buildClient(clientApiKey);
            const enriched = this._enrichPrompt(systemPrompt);
            return await this._generateWithSearch(client, enriched, userPrompt);
        } catch (error) {
            console.error("AIConnector.generateText Error:", error);
            if (error.status === 401) return "AUTENTICACIÓN FALLIDA: Tu API Key fue rechazada. Verifica que sea válida y esté activa.";
            return `ERROR DE RED: ${error.message || 'Fallo inesperado al contactar el modelo.'}`;
        }
    }

    async analyzeDocumentText(systemPrompt, documentText, query, clientApiKey) {
        if (this._demoCheck(clientApiKey)) {
            return "MODO DEMO OFFLINE: Análisis de documento simulado. Configura tu API Key para activar el análisis real con búsqueda en internet.";
        }
        try {
            const client = this._buildClient(clientApiKey);
            const enriched = this._enrichPrompt(systemPrompt);
            const userMsg = `DOCUMENTO ANALIZADO:\n${documentText}\n\nCONSULTA DEL ANALISTA:\n${query}`;
            return await this._generateWithSearch(client, enriched, userMsg);
        } catch (error) {
            console.error("AIConnector.analyzeDocumentText Error:", error);
            if (error.status === 401) return "AUTENTICACIÓN FALLIDA: Tu API Key fue rechazada al analizar este documento.";
            return `ERROR DE RED: ${error.message || 'Fallo inesperado al enviar el documento al motor de IA.'}`;
        }
    }
}

module.exports = { AIConnector: new AIConnector() };
