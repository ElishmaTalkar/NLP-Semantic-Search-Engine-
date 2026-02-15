import React, { useCallback, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isProcessing }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const validateFiles = (files: FileList | File[]) => {
        const validFiles: File[] = [];
        let hasError = false;

        Array.from(files).forEach(file => {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (['csv', 'pdf', 'txt'].includes(ext || '')) {
                validFiles.push(file);
            } else {
                setError('Unsupported file format. Please upload CSV, PDF, or TXT.');
                hasError = true;
            }
        });

        if (!hasError) setError(null);
        return validFiles;
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (isProcessing) return;

        const files = validateFiles(e.dataTransfer.files);
        if (files.length > 0) {
            onFilesSelected(files);
        }
    }, [isProcessing, onFilesSelected]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const files = validateFiles(e.target.files);
            if (files.length > 0) {
                onFilesSelected(files);
            }
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div
                className={clsx(
                    "relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group shadow-2xl bg-white",
                    isDragging ? "border-[#F95700] bg-orange-50 scale-105" : "border-gray-300 hover:border-[#F95700] hover:bg-orange-50",
                    isProcessing && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                <input
                    id="file-input"
                    type="file"
                    multiple
                    className="hidden"
                    accept=".csv,.pdf,.txt,.text"
                    onChange={handleChange}
                    disabled={isProcessing}
                />

                <div className="relative mb-6">
                    <div className="relative w-20 h-20 bg-gradient-to-br from-[#F95700] to-[#feca57] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                        <Upload className="text-white" size={40} strokeWidth={2.5} />
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-black mb-3">
                    Upload your documents
                </h3>
                <p className="text-black mb-6 text-base max-w-md font-medium">
                    Drag and drop your CSV, PDF, or TXT files here, or click to browse
                </p>

                <div className="flex gap-3 text-sm text-black font-bold">
                    <span className="glass border border-gray-400 px-4 py-2 rounded-xl shadow-lg hover:bg-white/50 transition-colors">CSV</span>
                    <span className="glass border border-gray-400 px-4 py-2 rounded-xl shadow-lg hover:bg-white/50 transition-colors">PDF</span>
                    <span className="glass border border-gray-400 px-4 py-2 rounded-xl shadow-lg hover:bg-white/50 transition-colors">TXT</span>
                </div>
            </div>

            {error && (
                <div className="mt-6 glass border border-red-300 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                        <div>
                            <h4 className="font-bold text-red-700 text-lg mb-1">Upload Error</h4>
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
