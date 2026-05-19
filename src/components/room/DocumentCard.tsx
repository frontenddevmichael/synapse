import { memo } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DocumentPreview } from '@/components/room/DocumentPreview';

interface DocumentCardProps {
  id: string;
  name: string;
  content: string | null;
  createdAt: string;
  canDelete: boolean;
  delay?: number;
  onDelete: (id: string) => void;
}

function DocumentCardImpl({ id, name, content, createdAt, canDelete, delay = 0, onDelete }: DocumentCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="bento-card group relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold truncate">{name}</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{new Date(createdAt).toLocaleDateString()}</p>
                {content && <DocumentPreview name={name} content={content} />}
              </div>
            </div>
          </div>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Delete document ${name}`} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete document?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete "{name}".</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const DocumentCard = memo(DocumentCardImpl);
