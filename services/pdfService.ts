import * as pdfjs from 'pdfjs-dist/build/pdf';

// FIX: PDF.js requires a worker to process files. The worker script must match the version
// of the main library. The previous attempt to load the worker from cdnjs.cloudflare.com failed
// because the version specified in the importmap ('^5.4.296') does not exist there, causing
// the "Failed to process PDF" error.
// The correct approach is to load the worker from the same CDN as the main library.
pdfjs.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@^5.4.296/build/pdf.worker.min.mjs';

export const extractTextFromPdf = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    const numPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
        fullText += `[Page ${i}]\n${pageText}\n\n`;
        onProgress(Math.round((i / numPages) * 100));
    }

    return fullText;
};

export const getPdfPageCount = async (file: File): Promise<number> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    return pdf.numPages;
}