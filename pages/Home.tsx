import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileUpload } from '../FileUpload';
import { Loader } from '../Loader';
import { processFile, ProcessedDocument } from '../file-processor';
import { SearchEngine, SearchResult } from '../search-engine';
import { Search, FileText, Sparkles } from 'lucide-react';

const searchEngine = new SearchEngine();

export const Home: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { registerDemoHandler } = useOutletContext<{ registerDemoHandler: (handler: () => Promise<void>) => void }>();

  // Demo handler for "GET STARTED" button
  useEffect(() => {
    const demoHandler = async () => {
      // Scroll to file upload area
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    registerDemoHandler(demoHandler);
  }, [registerDemoHandler]);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);

    try {
      const allDocs: ProcessedDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingProgress(((i + 1) / files.length) * 50); // First 50% for file processing

        try {
          const docs = await processFile(file);
          allDocs.push(...docs);
        } catch (err: any) {
          console.error(`Error processing ${file.name}:`, err);
          setError(`Failed to process ${file.name}: ${err.message}`);
        }
      }

      if (allDocs.length > 0) {
        setDocuments(prev => [...prev, ...allDocs]);

        // Add to search engine
        await searchEngine.addDocumentsAsync(allDocs, (progress) => {
          setProcessingProgress(50 + (progress / 2)); // Second 50% for indexing
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing files');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results = searchEngine.search(searchQuery, 20);
    setSearchResults(results);
  };

  return (
    <main className="max-w-6xl mx-auto p-6 pb-20">
      {/* Hero Section */}
      <div className="text-center mb-16 mt-12 animate-fadeIn">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="animate-float">
            <Sparkles className="text-black drop-shadow-lg" size={48} strokeWidth={2} />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-black">
            Semantic <span className="bg-gradient-to-r from-[#F95700] to-[#feca57] bg-clip-text text-transparent">NLP</span> Search
          </h1>
        </div>
        <p className="text-xl text-black max-w-2xl mx-auto font-medium leading-relaxed">
          Upload your documents and perform intelligent semantic searches using natural language processing
        </p>
      </div>

      {/* File Upload Section */}
      <div className="mb-12">
        <FileUpload onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />

        {isProcessing && (
          <div className="mt-6">
            <Loader />
            <div className="mt-4 max-w-2xl mx-auto">
              <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#F95700] h-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-center text-sm text-slate-600 mt-2">
                Processing documents... {Math.round(processingProgress)}%
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Documents Status */}
      {documents.length > 0 && (
        <div className="mb-12 max-w-2xl mx-auto animate-fadeIn">
          <div className="glass border-2 border-green-400/30 rounded-2xl p-5 flex items-center gap-4 shadow-xl hover-lift">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl shadow-lg">
              <FileText className="text-white" size={24} />
            </div>
            <span className="text-black font-bold text-lg">
              {documents.length} document{documents.length !== 1 ? 's' : ''} indexed and ready to search
            </span>
          </div>
        </div>
      )}

      {/* Search Section */}
      {documents.length > 0 && (
        <div className="mb-16 animate-fadeIn">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative glass p-2 rounded-2xl shadow-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/60" size={24} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your documents..."
                className="flex-1 px-6 py-4 bg-white/90 backdrop-blur-md border-2 border-gray-300 rounded-2xl text-black placeholder-black/50 focus:outline-none focus:border-[#F95700] transition-all text-lg shadow-xl"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#F95700] to-[#feca57] text-black px-8 py-3 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 hover-glow"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Search Results ({searchResults.length})
          </h2>
          <div className="space-y-4">
            {searchResults.map((result, idx) => (
              <div
                key={`${result.document.id}-${idx}`}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <FileText size={18} className="text-[#F95700]" />
                    {result.document.filename}
                  </h3>
                  <span className="text-sm font-medium text-[#F95700] bg-orange-50 px-3 py-1 rounded-full">
                    Score: {result.score.toFixed(2)}
                  </span>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {result.matchSnippet}
                </p>

                {result.document.metadata && (
                  <div className="flex flex-wrap gap-2">
                    {result.document.metadata.topics && result.document.metadata.topics.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Topics:</span>
                        {result.document.metadata.topics.slice(0, 3).map((topic: string, i: number) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchQuery && searchResults.length === 0 && documents.length > 0 && (
        <div className="max-w-2xl mx-auto text-center py-16 animate-fadeIn">
          <div className="glass rounded-2xl p-12 shadow-xl">
            <p className="text-black text-2xl font-bold mb-3">No results found for "{searchQuery}"</p>
            <p className="text-black/70 text-base">Try different keywords or upload more documents</p>
          </div>
        </div>
      )}
    </main>
  );
};
