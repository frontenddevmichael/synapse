import { useRef, useState } from 'react';
import { File, FileText, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatFileSize, isFileTooLarge } from '@/lib/pdfParser';
import { parseDocument, isSupportedFile, SUPPORTED_ACCEPT } from '@/lib/documentParser';

interface UploadDocumentDialogProps {
  roomId: string;
  userId: string;
  onUploaded: (doc: { id: string; name: string; content: string | null; created_at: string }) => void;
}

export function UploadDocumentDialog({ roomId, userId, onUploaded }: UploadDocumentDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'paste' | 'file'>('paste');
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parseProgress, setParseProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setMode('paste'); setDocName(''); setDocContent('');
    setSelectedFile(null); setUploadError(null); setParseProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    if (isFileTooLarge(file, 10)) {
      const msg = 'Maximum file size is 10 MB.';
      setUploadError(msg);
      toast({ title: 'File too large', description: msg, variant: 'destructive' });
      return;
    }
    if (!isSupportedFile(file)) {
      const msg = 'Unsupported file type. Please use PDF, DOCX, TXT, MD, or CSV.';
      setUploadError(msg);
      toast({ title: 'Unsupported file', description: msg, variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
    if (!docName) setDocName(file.name.replace(/\.[^/.]+$/, ''));
    setIsParsing(true);
    setParseProgress(null);
    try {
      const result = await parseDocument(file, (p) => setParseProgress(p));
      if (!result.text.trim()) {
        throw new Error('No text could be extracted from this file. It may be empty, image-only, or password-protected.');
      }
      setDocContent(result.text);
      toast({
        title: 'File parsed successfully',
        description: `Extracted ${result.charCount.toLocaleString()} characters`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Please try a different file';
      setUploadError(msg);
      toast({ title: 'Failed to parse file', description: msg, variant: 'destructive' });
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
      setParseProgress(null);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (file) await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null); setDocContent(''); setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!docName.trim() || !docContent.trim()) return;
    setIsUploading(true);
    const { data: inserted, error } = await supabase.from('documents').insert({
      room_id: roomId, uploaded_by: userId, name: docName.trim(), content: docContent.trim(),
    }).select().single();
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Document uploaded!', description: 'You can now generate quizzes from this document.' });
      if (inserted) onUploaded(inserted as any);
      reset();
      setOpen(false);
    }
    setIsUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-semibold">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold">Upload Document</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Upload a PDF or paste your study material to generate quizzes
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="flex gap-2">
            <Button variant={mode === 'paste' ? 'default' : 'outline'} size="sm" onClick={() => setMode('paste')} className="flex-1 min-h-[44px]">
              Paste Text
            </Button>
            <Button variant={mode === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setMode('file')} className="flex-1 min-h-[44px]">
              Upload File
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="upload-doc-name">Document name</Label>
            <Input id="upload-doc-name" placeholder="e.g., Chapter 5 Notes" value={docName} onChange={(e) => setDocName(e.target.value)} className="h-11" />
          </div>
          {mode === 'paste' ? (
            <div className="space-y-2">
              <Label htmlFor="upload-doc-content">Content</Label>
              <Textarea id="upload-doc-content" placeholder="Paste your study material here..." value={docContent} onChange={(e) => setDocContent(e.target.value)} rows={6} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>File</Label>
              {!selectedFile ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-5 sm:p-8 text-center cursor-pointer transition-colors ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <File className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-muted-foreground" />
                  <p className="text-xs sm:text-sm font-medium">
                    {isDragging ? 'Drop file here' : 'Click or drag a file to upload'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    PDF, DOCX, TXT, MD, or CSV — max 10 MB
                  </p>
                </div>
              ) : (
                <div className="border border-border rounded-xl p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                      <div>
                        <p className="font-medium text-xs sm:text-sm">{selectedFile.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearSelectedFile} disabled={isParsing} aria-label="Remove selected file" className="min-h-[44px] min-w-[44px]">
                      {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    </Button>
                  </div>
                  {isParsing && parseProgress && (
                    <div className="mt-3 space-y-1">
                      <Progress value={(parseProgress.current / parseProgress.total) * 100} className="h-1.5" />
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Parsing page {parseProgress.current} of {parseProgress.total}…
                      </p>
                    </div>
                  )}
                  {isParsing && !parseProgress && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Reading file…
                    </p>
                  )}
                  {docContent && !isParsing && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                      ✓ Extracted {docContent.length.toLocaleString()} characters
                    </p>
                  )}
                </div>
              )}
              {uploadError && <p className="text-xs text-destructive mt-1">{uploadError}</p>}
              <input
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_ACCEPT}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
          <Button
            className="w-full h-11 font-semibold"
            onClick={handleUpload}
            disabled={isUploading || isParsing || !docName.trim() || !docContent.trim()}
          >
            {(isParsing || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isParsing ? 'Parsing file…' : isUploading ? 'Saving document…' : 'Upload Document'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
