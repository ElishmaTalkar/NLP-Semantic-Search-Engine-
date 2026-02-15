import Papa from 'papaparse';
import { nlpEngine } from './nlp-engine'; // Import NLP Engine

export interface ProcessedDocument {
    id: string;
    content: string;
    filename: string;
    metadata?: Record<string, any>;
}

export const processFile = async (file: File): Promise<ProcessedDocument[]> => {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    switch (fileType) {
        case 'csv':
            return processCSV(file);
        case 'pdf':
            return processPDF(file);
        case 'txt':
        case 'text':
            return processTXT(file);
        default:
            throw new Error(`Unsupported file format: .${fileType}. Please upload CSV, PDF, or TXT.`);
    }
};

const processCSV = (file: File): Promise<ProcessedDocument[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            worker: false,
            encoding: "UTF-8",
            transformHeader: (h) => h.trim(),
            complete: (results: any) => {
                if (results.errors.length && !results.data.length) {
                    reject(new Error('Failed to parse CSV: ' + results.errors[0].message));
                    return;
                }

                const docs = results.data.map((row: any, index: number) => {
                    const content = Object.keys(row)
                        .filter(k => typeof row[k] === 'string')
                        .map(k => `${k}: ${row[k]}`)
                        .join('\n');

                    // Run NLP Analysis
                    const nlpData = nlpEngine.analyze(content);

                    return {
                        id: `${file.name}-${index}`,
                        content,
                        filename: file.name,
                        metadata: { ...row, ...nlpData } // Merge NLP data
                    };
                }).filter((doc: ProcessedDocument) => doc.content.length > 0);

                if (docs.length === 0) {
                    reject(new Error('No valid content found in CSV.'));
                    return;
                }

                resolve(docs);
            },
            error: (error: any) => reject(new Error('Failed to parse CSV: ' + error.message))
        });
    });
};

const processTXT = (file: File): Promise<ProcessedDocument[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (!content?.trim()) {
                reject(new Error('File is empty.'));
                return;
            }

            // Run NLP Analysis
            const nlpData = nlpEngine.analyze(content);

            resolve([{
                id: `${file.name}-1`,
                content: content,
                filename: file.name,
                metadata: nlpData
            }]);
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsText(file);
    });
};

const processPDF = async (file: File): Promise<ProcessedDocument[]> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `Page ${i}:\n${pageText}\n\n`;
        }

        if (!fullText.trim()) {
            throw new Error('No text content found in PDF (scanned image?).');
        }

        // Run NLP Analysis
        const nlpData = nlpEngine.analyze(fullText);

        return [{
            id: file.name,
            content: fullText,
            filename: file.name,
            metadata: nlpData
        }];
    } catch (error: any) {
        console.error('PDF Processing Error:', error);
        throw new Error('Failed to process PDF: ' + (error.message || 'Unknown error'));
    }
}
