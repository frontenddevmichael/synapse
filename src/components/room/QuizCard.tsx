import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface QuizCardProps {
  id: string;
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimitMinutes: number | null;
  mode: 'study' | 'challenge' | 'exam';
  canDelete: boolean;
  delay?: number;
  onDelete: (id: string) => void;
}

const difficultyClass = (d: string) => {
  switch (d) {
    case 'easy': return 'bg-success/10 text-success border-success/20';
    case 'medium': return 'bg-warning/10 text-warning border-warning/20';
    case 'hard': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

function QuizCardImpl({ id, title, description, difficulty, timeLimitMinutes, mode, canDelete, delay = 0, onDelete }: QuizCardProps) {
  const navigate = useNavigate();
  const stripClass = mode === 'study' ? 'bg-mode-study' : mode === 'challenge' ? 'bg-mode-challenge' : 'bg-mode-exam';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div
        className="bento-card cursor-pointer group hover:shadow-lg relative"
        onClick={() => navigate(`/quiz/${id}`)}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${stripClass}`} />
        <div className="flex items-start justify-between gap-3 mt-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>}
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className={`${difficultyClass(difficulty)} text-xs`}>{difficulty}</Badge>
              {timeLimitMinutes && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {timeLimitMinutes}m
                </span>
              )}
            </div>
          </div>
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon"
                  aria-label={`Delete quiz ${title}`}
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete "{title}" and all its questions.</AlertDialogDescription>
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

export const QuizCard = memo(QuizCardImpl);
