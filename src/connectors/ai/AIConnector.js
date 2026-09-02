const { OpenAI } = require('openai');

class AIConnector {
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            console.warn("WARNING: OPENAI_API_KEY is not set. AI Features will fail.");
        }
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || "dummy-key-to-prevent-crash"
        });
    }

    async generateText(systemPrompt, userPrompt) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4o", // O utilizar el modelo base indicado si varía
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.2
            });
            return response.choices[0].message.content;
        } catch (error) {
            console.error("AIConnector Error:", error);
            throw error;
        }
    }

    async analyzeDocumentText(systemPrompt, documentText, query) {
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
            throw error;
        }
    }
}

module.exports = { AIConnector: new AIConnector() };
