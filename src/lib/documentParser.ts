// Unified document parser supporting PDF, DOCX, TXT, MD, CSV
import { extractTextFromPDFWithProgress } from './pdfParser';

export type ParseProgress = { current: number; total: number };

export interface ParseResult {
  text: string;
  charCount: number;
  pageCount?: number;
  format: 'pdf' | 'docx' | 'text';
}

const TEXT_EXTENSIONS = ['txt', 'md', 'markdown', 'csv', 'tsv', 'log', 'json'];

function getExtension(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

export function isSupportedFile(file: File): boolean {
  const ext = getExtension(file.name);
  if (ext === 'pdf' || ext === 'docx') return true;
  if (TEXT_EXTENSIONS.includes(ext)) return true;
  // Fallback to MIME
  if (file.type === 'application/pdf') return true;
  if (file.type.startsWith('text/')) return true;
  return false;
}

export async function parseDocument(
  file: File,
  onProgress?: (p: ParseProgress) => void
): Promise<ParseResult> {
  const ext = getExtension(file.name);
  const mime = file.type;

  // PDF
  if (ext === 'pdf' || mime === 'application/pdf') {
    const result = await extractTextFromPDFWithProgress(file, (current, total) =>
      onProgress?.({ current, total })
    );
    return { text: result.text, charCount: result.charCount, pageCount: result.pageCount, format: 'pdf' };
  }

  // DOCX
  if (ext === 'docx' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth/mammoth.browser');
    const arrayBuffer = await file.arrayBuffer();
    const result = await (mammoth as any).extractRawText({ arrayBuffer });
    const text = (result?.value || '').trim();
    return { text, charCount: text.length, format: 'docx' };
  }

  // Plain text family
  if (TEXT_EXTENSIONS.includes(ext) || mime.startsWith('text/')) {
    const text = (await file.text()).trim();
    return { text, charCount: text.length, format: 'text' };
  }

  throw new Error(
    `Unsupported file type: ${ext || mime || 'unknown'}. Use PDF, DOCX, TXT, MD, or CSV.`
  );
}

export const SUPPORTED_ACCEPT =
  '.pdf,.docx,.txt,.md,.markdown,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv';
