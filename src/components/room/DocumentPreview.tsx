import { FileText } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentPreviewProps {
  name: string;
  content: string | null;
}

export function DocumentPreview({ name, content }: DocumentPreviewProps) {
  const preview = content?.slice(0, 2000) || '';
  const isTruncated = (content?.length || 0) > 2000;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
          <FileText className="h-3.5 w-3.5" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {name}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[50vh]">
          <div className="prose prose-sm dark:prose-invert max-w-none p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {preview}
            {isTruncated && (
              <p className="text-muted-foreground mt-4 italic">
                ... showing first 2,000 of {content!.length.toLocaleString()} characters
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
