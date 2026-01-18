// PDF Parser with CDN-based worker for better build compatibility
import * as pdfjsLib from 'pdfjs-dist';

// Use CDN for the worker to avoid build issues with the bundled worker
const PDFJS_VERSION = '4.4.168';
const PDFJS_CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

// Set the worker source using CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN_URL;

export interface PDFParseResult {
  text: string;
  pageCount: number;
  charCount: number;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      // Disable font loading to speed up parsing
      disableFontFace: true,
      // Use standard fonts
      standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/standard_fonts/`
    }).promise;
    
    let fullText = '';
    const totalPages = pdf.numPages;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to parse PDF: ${error.message}` 
        : 'Failed to parse PDF. The file may be corrupted or password-protected.'
    );
  }
}

export async function extractTextFromPDFWithProgress(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<PDFParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      disableFontFace: true,
      standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/standard_fonts/`
    }).promise;
    
    let fullText = '';
    const totalPages = pdf.numPages;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (onProgress) {
        onProgress(pageNum, totalPages);
      }
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    const text = fullText.trim();
    
    return {
      text,
      pageCount: totalPages,
      charCount: text.length
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to parse PDF: ${error.message}` 
        : 'Failed to parse PDF. The file may be corrupted or password-protected.'
    );
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function isFileTooLarge(file: File, maxSizeMB: number = 10): boolean {
  return file.size > maxSizeMB * 1024 * 1024;
}
