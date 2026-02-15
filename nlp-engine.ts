
// Basic Stopwords to filter out
const COMMON_STOPWORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
    'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
    'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
    'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
    'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'has', 'had',
    'been', 'introduction', 'conclusion', 'chapter', 'page', 'fig', 'figure', 'table'
]);

export interface NLPMetadata {
    entities: string[];
    topics: string[];
    sentiment?: 'positive' | 'negative' | 'neutral'; // Future placeholder
    summary?: string; // Future placeholder
}

export class NLPEngine {

    /**
     * Extract Named Entities using Rule-Based approaches
     * (Regex for Capitalized words, Dates, Emails)
     */
    public extractEntities(text: string): string[] {
        const entities = new Set<string>();

        // 1. Emails
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = text.match(emailRegex) || [];
        emails.forEach(e => entities.add(e));

        // 2. Years (1900-2099)
        const yearRegex = /\b(19|20)\d{2}\b/g;
        const years = text.match(yearRegex) || [];
        years.forEach(y => entities.add(y));

        // 3. Capitalized Words (Potential Names/Orgs) - very naive
        // Filter out start of sentences by checking punctuation before it.
        // This is tricky without sentence splitting. 
        // Heuristic: Look for Capitalized words that are NOT at the start of a logical sentence (after . ? !)
        // Or just capture all and filter stopwords.

        const contentWords = text.split(/\s+/);

        for (let i = 0; i < contentWords.length; i++) {
            const word = contentWords[i].replace(/[^a-zA-Z0-9]/g, '');
            // Check if capitalized
            if (word.length > 2 && /^[A-Z][a-z]+$/.test(word)) {
                // Check if it's a stopword (even capitalized stopwords exist sometimes)
                if (!COMMON_STOPWORDS.has(word.toLowerCase())) {
                    // Primitive check: if previous word ended with '.', it might be start of sentence.
                    // But for now, let's just add it as a candidate.
                    // To improve: check if the word appears predominantly capitalized in the text?
                    entities.add(word);
                }
            }
        }

        return Array.from(entities).slice(0, 10); // Return top 10 potential entities
    }

    /**
     * Extract Key Topics (Keywords) using TF (Term Frequency)
     */
    public extractTopics(text: string): string[] {
        const tokens = text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 3 && !COMMON_STOPWORDS.has(t));

        const frequency: Record<string, number> = {};

        tokens.forEach(token => {
            frequency[token] = (frequency[token] || 0) + 1;
        });

        // Convert to array and sort by frequency
        return Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5) // Top 5 topics
            .map(([term]) => term);
    }

    /**
     * Main analysis function
     */
    public analyze(text: string): NLPMetadata {
        return {
            entities: this.extractEntities(text),
            topics: this.extractTopics(text)
        };
    }
}

export const nlpEngine = new NLPEngine();
