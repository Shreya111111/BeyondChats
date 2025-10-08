
import React, { useRef } from 'react';
import { usePdf } from '../contexts/PdfContext';
import { UploadCloud, FileText, X } from 'lucide-react';

const SourceSelector: React.FC = () => {
    const { 
        addPdfFile, 
        availablePdfs, 
        activePdfName, 
        setActivePdfName,
        removePdf,
        isLoading 
    } = usePdf();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            addPdfFile(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveClick = (e: React.MouseEvent, name: string) => {
        e.stopPropagation(); 
        if (window.confirm(`Are you sure you want to remove "${name}"?`)) {
            removePdf(name);
        }
    };

    return (
        <div className="space-y-4 flex flex-col h-full">
            <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200 flex-shrink-0">PDF Sources</h3>
            
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Uploaded PDFs</p>
                {availablePdfs.length > 0 ? (
                    availablePdfs.map((pdf) => (
                        <button
                            key={pdf.name}
                            onClick={() => setActivePdfName(pdf.name)}
                            disabled={isLoading}
                            className={`w-full text-left p-2 rounded-md transition-colors disabled:opacity-50 group flex items-center justify-between
                                ${activePdfName === pdf.name 
                                    ? 'bg-primary-100 dark:bg-primary-900/50 ring-2 ring-primary-500' 
                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`
                            }
                        >
                            <div className="flex items-center min-w-0">
                                <FileText className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                <span className="truncate">{pdf.name}</span>
                            </div>
                            <span 
                                onClick={(e) => handleRemoveClick(e, pdf.name)}
                                className="ml-2 p-1 rounded-full text-gray-400 hover:bg-red-200 dark:hover:bg-red-800 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title={`Remove ${pdf.name}`}
                            >
                                <X size={16} />
                            </span>
                        </button>
                    ))
                ) : (
                    <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 border-2 border-dashed dark:border-gray-600 rounded-lg">
                        Upload a PDF to begin.
                    </div>
                )}
            </div>
            
            <div className="flex-shrink-0">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/pdf"
                    className="hidden"
                    disabled={isLoading}
                />
                <button
                    onClick={handleUploadClick}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center p-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:bg-primary-300"
                >
                    <UploadCloud className="mr-2" size={20} />
                    <span>{isLoading ? 'Processing...' : 'Upload PDF'}</span>
                </button>
            </div>
        </div>
    );
};

export default SourceSelector;
