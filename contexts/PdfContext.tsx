
import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { extractTextFromPdf, getPdfPageCount } from '../services/pdfService';
import toast from 'react-hot-toast';
import { PdfData } from '../types';

interface PdfContextType {
    // PDF Management
    availablePdfs: PdfData[];
    activePdfName: string | null;
    addPdfFile: (file: File) => Promise<void>;
    removePdf: (name: string) => void;
    setActivePdfName: (name: string) => void;

    // For convenience in consumer components (derived from active PDF)
    pdfFile: File | null;
    pdfText: string;
    pdfName: string;
    totalPages: number;

    // Upload status
    isLoading: boolean;
    progress: number;
}

const PdfContext = createContext<PdfContextType | undefined>(undefined);

export const PdfProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pdfs, setPdfs] = useState<Map<string, PdfData>>(new Map());
    const [activePdfName, setActivePdfNameState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

    const addPdfFile = useCallback(async (file: File) => {
        if (pdfs.has(file.name)) {
            toast.error(`A PDF named "${file.name}" is already loaded.`);
            setActivePdfNameState(file.name);
            return;
        }

        setIsLoading(true);
        setProgress(0);
        const toastId = toast.loading(`Processing ${file.name}...`);

        try {
            const pages = await getPdfPageCount(file);
            toast.loading(`Extracting text from ${pages} pages...`, { id: toastId });
            const text = await extractTextFromPdf(file, (p) => setProgress(p));

            const newPdfData: PdfData = {
                file,
                name: file.name,
                text,
                totalPages: pages,
            };

            setPdfs(prevPdfs => {
                const newPdfs = new Map(prevPdfs);
                newPdfs.set(file.name, newPdfData);
                return newPdfs;
            });

            setActivePdfNameState(file.name);
            toast.success(`${file.name} processed successfully!`, { id: toastId });
        } catch (error) {
            console.error("Failed to process PDF:", error);
            toast.error(`Failed to process ${file.name}.`, { id: toastId });
        } finally {
            setIsLoading(false);
            setProgress(100);
        }
    }, [pdfs]);
    
    const removePdf = useCallback((name: string) => {
        setPdfs(prevPdfs => {
            const newPdfs = new Map(prevPdfs);
            newPdfs.delete(name);

            if (activePdfName === name) {
                const nextActivePdfName = newPdfs.keys().next().value || null;
                setActivePdfNameState(nextActivePdfName);
            }
            return newPdfs;
        });
        toast.success(`Removed "${name}".`);
    }, [activePdfName]);

    const setActivePdfName = useCallback((name: string) => {
        if (pdfs.has(name)) {
            setActivePdfNameState(name);
        }
    }, [pdfs]);

    const availablePdfs = useMemo(() => Array.from(pdfs.values()), [pdfs]);
    const activePdf = useMemo(() => {
        return activePdfName ? pdfs.get(activePdfName) ?? null : null;
    }, [activePdfName, pdfs]);

    const contextValue: PdfContextType = useMemo(() => ({
        availablePdfs,
        activePdfName,
        addPdfFile,
        removePdf,
        setActivePdfName,
        pdfFile: activePdf?.file ?? null,
        pdfText: activePdf?.text ?? '',
        pdfName: activePdf?.name ?? '',
        totalPages: activePdf?.totalPages ?? 0,
        isLoading,
        progress,
    }), [availablePdfs, activePdfName, addPdfFile, removePdf, setActivePdfName, activePdf, isLoading, progress]);

    return (
        <PdfContext.Provider value={contextValue}>
            {children}
        </PdfContext.Provider>
    );
};

export const usePdf = (): PdfContextType => {
    const context = useContext(PdfContext);
    if (context === undefined) {
        throw new Error('usePdf must be used within a PdfProvider');
    }
    return context;
};
