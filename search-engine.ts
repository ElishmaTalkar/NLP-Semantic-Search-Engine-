import type { ProcessedDocument } from "./file-processor";

// Simple Stopwords List
const STOPWORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
    'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
    'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
    'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
    'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
    'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
    'under', 'until', 'up', 'very',
    'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
    'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

export interface SearchResult {
    document: ProcessedDocument;
    score: number;
    matchSnippet: string;
}

export class SearchEngine {
    private documents: Map<string, ProcessedDocument> = new Map();
    // Inverted Index: Term -> List of { docId, tf }
    private invertedIndex: Map<string, { docId: string; tf: number }[]> = new Map();
    // Document Norms: docId -> magnitude (for cosine similarity normalization)
    private docNorms: Map<string, number> = new Map();
    // ID Frequency: Term -> Number of docs containing it
    private idfCache: Map<string, number> = new Map();
    private totalDocsProcessed = 0;

    constructor() { }

    public async addDocuments(docs: ProcessedDocument[]) {
        await this.addDocumentsAsync(docs);
    }

    public async addDocumentsAsync(docs: ProcessedDocument[], onProgress?: (progress: number) => void) {
        const chunkSize = 100;
        const total = docs.length;

        for (let i = 0; i < total; i += chunkSize) {
            const chunk = docs.slice(i, i + chunkSize);

            // Process chunk
            chunk.forEach(doc => {
                if (this.documents.has(doc.id)) return; // Skip duplicates for now
                this.documents.set(doc.id, doc);
                this.indexDocument(doc);
            });

            this.totalDocsProcessed += chunk.length;

            if (onProgress) {
                onProgress(Math.min(100, (i + chunkSize) / total * 100));
            }
            // Yield to main thread
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        // Invalidate IDF cache as N has changed
        this.idfCache.clear();

        if (onProgress) onProgress(100);
    }

    private indexDocument(doc: ProcessedDocument) {
        const tokens = this.tokenize(doc.content);
        const termCounts = new Map<string, number>();

        // 1. Count Term Frequencies (TF)
        tokens.forEach(token => {
            termCounts.set(token, (termCounts.get(token) || 0) + 1);
        });

        // 2. Update Inverted Index & Calculate Doc Norm
        let sumSquaredWeights = 0;
        const totalTerms = tokens.length;

        termCounts.forEach((count, term) => {
            const tf = count / totalTerms; // Normalized TF

            // Update Index
            if (!this.invertedIndex.has(term)) {
                this.invertedIndex.set(term, []);
            }
            this.invertedIndex.get(term)!.push({ docId: doc.id, tf });

            // Accumulate for norm (Note: we don't have accurate IDF yet, 
            // so we'll store basic weight magnitude and adjust during search or 
            // use a simplified norm assumption. 
            // For true cosine similarity with changing IDF, we usually 
            // calculate dot product and mag at search time or approx.)
            // A common approx is just using TF for norm storage or re-calc doc mag at search.
            // Let's store sum of TF^2 for now as a "local" norm component.
            sumSquaredWeights += tf * tf;
        });

        this.docNorms.set(doc.id, Math.sqrt(sumSquaredWeights));
    }

    public search(query: string, limit: number = 20): SearchResult[] {
        if (!query.trim()) return [];

        const queryTokens = this.tokenize(query);
        if (queryTokens.length === 0) return [];

        const N = this.documents.size;
        if (N === 0) return [];

        const scores = new Map<string, number>(); // docId -> score
        const matchedTerms = new Map<string, Set<string>>(); // docId -> Set of matched terms

        // BM25 parameters
        const k1 = 1.5; // Term frequency saturation parameter
        const b = 0.75; // Length normalization parameter

        // Calculate average document length
        let totalLength = 0;
        this.documents.forEach(doc => {
            totalLength += this.tokenize(doc.content).length;
        });
        const avgDocLength = totalLength / N;

        // 1. Calculate scores for each query term
        queryTokens.forEach(term => {
            const postings = this.invertedIndex.get(term);
            if (!postings) return;

            // Calculate IDF for this term (with smoothing to avoid zero)
            const docFreq = postings.length;
            const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);

            // Score each document containing this term
            postings.forEach(posting => {
                const doc = this.documents.get(posting.docId);
                if (!doc) return;

                // Get document length
                const docLength = this.tokenize(doc.content).length;

                // BM25 scoring
                const termFreq = posting.tf * docLength; // Convert normalized TF back to count
                const lengthNorm = 1 - b + b * (docLength / avgDocLength);
                const bm25Score = idf * (termFreq * (k1 + 1)) / (termFreq + k1 * lengthNorm);

                const currentScore = scores.get(posting.docId) || 0;
                scores.set(posting.docId, currentScore + bm25Score);

                // Track matched terms for boosting
                if (!matchedTerms.has(posting.docId)) {
                    matchedTerms.set(posting.docId, new Set());
                }
                matchedTerms.get(posting.docId)!.add(term);
            });
        });

        // 2. Apply query coverage boost (more matched terms = higher score)
        scores.forEach((score, docId) => {
            const matchCount = matchedTerms.get(docId)?.size || 0;
            const coverage = matchCount / queryTokens.length;
            // Boost score based on query coverage
            scores.set(docId, score * (1 + coverage));
        });

        // 3. Format and sort results
        const results: SearchResult[] = [];

        scores.forEach((score, docId) => {
            const doc = this.documents.get(docId);
            if (!doc) return;

            results.push({
                document: doc,
                score: Math.round(score * 100) / 100, // Round to 2 decimal places
                matchSnippet: ''
            });
        });

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(r => ({
                ...r,
                matchSnippet: this.getSnippet(r.document.content, queryTokens)
            }));
    }

    public clear() {
        this.documents.clear();
        this.invertedIndex.clear();
        this.docNorms.clear();
        this.idfCache.clear();
        this.totalDocsProcessed = 0;
    }

    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            // Improved Regex: Allows alphanumeric, hyphens inside words, etc.
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            // Less aggressive filter: Allow 2+ chars, keep numbers.
            .filter(token => token.length >= 2 && !STOPWORDS.has(token));
    }

    private getSnippet(content: string, queryTokens: string[]): string {
        const lowerContent = content.toLowerCase();
        let bestIndex = -1;

        for (const token of queryTokens) {
            const idx = lowerContent.indexOf(token);
            if (idx !== -1) {
                bestIndex = idx;
                break;
            }
        }

        if (bestIndex === -1) return content.slice(0, 150) + '...';

        const start = Math.max(0, bestIndex - 60);
        const end = Math.min(content.length, bestIndex + 200);
        return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
    }
}

// Global instance placeholder (legacy support if needed, but App.tsx constructs its own)
export const searchEngine = new SearchEngine();
