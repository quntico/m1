const { OpenAI } = require('openai');

class AIConnector {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || "dummy-key-to-prevent-crash";
        if (!process.env.OPENAI_API_KEY) {
            console.warn("WARNING: OPENAI_API_KEY is not set. AI Features will run in DEMO MODE.");
        }
        this.openai = new OpenAI({
            apiKey: this.apiKey
        });
    }

    async generateText(systemPrompt, userPrompt) {
        if (this.apiKey === "dummy-key-to-prevent-crash") {
            return "MODO DEMO OFFLINE: Se ha detectado la ausencia de una API Key válida. El motor Bid Architect está operando en modo simulación de red.\n\nANÁLISIS:\n- La conexión al backend es correcta.\n- La validación documental está activa pero requiere sincronización Cloud para inferencias reales.\n\nACCIÓN RECOMENDADA:\nVe a Administración ⚙️ e ingresa tu Clave API Cloud para desbloquear la potencia analítica completa.";
        }

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.2
            });
            return response.choices[0].message.content;
        } catch (error) {
            console.error("AIConnector Error:", error);
            if (error.status === 401) return "AUTENTICACIÓN FALLIDA: Tu API Key fue rechazada por el servidor LLM. Verifica las credenciales e intenta nuevamente.";
            throw error;
        }
    }

    async analyzeDocumentText(systemPrompt, documentText, query) {
        if (this.apiKey === "dummy-key-to-prevent-crash") {
            return "MODO DEMO OFFLINE: Análisis de documento simulado con éxito.\nNo se ha procesado con IA profunda por ausencia de credenciales Cloud reales.";
        }

        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `DOCUMENT TEXT:\n${documentText}\n\nQUERY:\n${query}` }
                ],
                temperature: 0.1
            });
            return response.choices[0].message.content;
        } catch (error) {
            console.error("AIConnector Document Analysis Error:", error);
            if (error.status === 401) return "AUTENTICACIÓN FALLIDA: Tu API Key fue rechazada al analizar este documento.";
            throw error;
        }
    }
}

module.exports = { AIConnector: new AIConnector() };
