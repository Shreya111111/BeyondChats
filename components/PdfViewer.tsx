import React, { useEffect, useRef, useState } from 'react';
// FIX: Changed import paths for pdfjs and its types to use 'pdfjs-dist/build/pdf'.
// This resolves the error where 'RenderParameters' was not found in the root 'pdfjs-dist' module
// and makes the import consistent with its usage in other files like `pdfService.ts`.
import * as pdfjs from 'pdfjs-dist/build/pdf';
import type { PageViewport, RenderParameters } from 'pdfjs-dist/build/pdf';

interface PdfViewerProps {
    file: File;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState(0);

    useEffect(() => {
        const renderPdf = async () => {
            if (!file || !containerRef.current) return;

            setIsLoading(true);
            setError(null);
            setNumPages(0);
            
            const container = containerRef.current;
            container.innerHTML = ''; // Clear previous canvases

            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument(arrayBuffer).promise;
                setNumPages(pdf.numPages);

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    // Adjust scale for better resolution, then scale down with CSS
                    const viewport = page.getViewport({ scale: 2.0 });

                    const canvas = document.createElement('canvas');
                    canvas.className = "mb-4 shadow-md";
                    const context = canvas.getContext('2d');
                    if (!context) {
                        console.warn(`Could not get canvas context for page ${i}`);
                        continue;
                    }

                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    canvas.style.width = "100%";
                    canvas.style.height = "auto";
                    
                    container.appendChild(canvas);

                    // FIX: The type definitions for this version of pdf.js require the 'canvas' property on the render context.
                    const renderContext: RenderParameters = {
                        canvasContext: context,
                        viewport: viewport,
                        canvas: canvas,
                    };
                    await page.render(renderContext).promise;
                }
            } catch (err) {
                console.error("Error rendering PDF:", err);
                setError("Failed to render the PDF file. It might be corrupted or in an unsupported format.");
            } finally {
                setIsLoading(false);
            }
        };

        renderPdf();
    }, [file]);

    return (
        <div className="w-full h-full overflow-y-auto bg-gray-200 dark:bg-gray-900 p-2 sm:p-4">
            {isLoading && (
                <div className="text-center text-gray-600 dark:text-gray-300 p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p>Rendering PDF...</p>
                    {numPages > 0 && <p className="text-sm">Loading {numPages} pages</p>}
                </div>
            )}
            {error && (
                <div className="text-center text-red-500 p-8">
                    <p className="font-semibold">Error</p>
                    <p>{error}</p>
                </div>
            )}
            <div ref={containerRef} className="flex flex-col items-center"></div>
        </div>
    );
};

export default PdfViewer;