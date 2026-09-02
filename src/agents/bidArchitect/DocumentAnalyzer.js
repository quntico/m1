const fs = require('fs');
const path = require('path');

class DocumentAnalyzer {
    async extractText(filePath, originalName) {
        const ext = path.extname(originalName).toLowerCase();

        // FASE 1: Simple text read for txt. For PDFs and DOCX we'd use external libs (e.g. pdf-parse).
        // Since we want to keep dependencies light initially, if it's not text we simulate a placeholder 
        // to pass to AI, which would just get the name for now.

        if (ext === '.txt' || ext === '.csv' || ext === '.json' || ext === '.md') {
            return fs.readFileSync(filePath, 'utf-8');
        }

        // Feature placeholder for binary documents
        return `[BINAARY FILE CONTENT OMITTED] Name: ${originalName}. \nEl asistente AI debe solicitar a otra herramienta (OCR) para leer esto, pero por ahora solo infiere lo posible por el nombre original.`;
    }
}

module.exports = new DocumentAnalyzer();
