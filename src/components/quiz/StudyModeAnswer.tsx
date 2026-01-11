import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudyModeAnswerProps {
  options: string[];
  selectedAnswer: string | undefined;
  correctAnswer: string;
  explanation: string | null;
  showFeedback: boolean;
}

export const StudyModeAnswer = ({
  options,
  selectedAnswer,
  correctAnswer,
  explanation,
  showFeedback,
}: StudyModeAnswerProps) => {
  if (!showFeedback || !selectedAnswer) return null;

  const isCorrect = selectedAnswer === correctAnswer;

  return (
    <div className="mt-4 space-y-3 animate-fade-in">
      <div
        className={cn(
          'flex items-center gap-3 p-4 rounded-lg border',
          isCorrect
            ? 'bg-success/10 border-success/50 text-success'
            : 'bg-destructive/10 border-destructive/50 text-destructive'
        )}
      >
        {isCorrect ? (
          <>
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">Correct!</span>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">
              Incorrect. The correct answer is: {correctAnswer}
            </span>
          </>
        )}
      </div>

      {explanation && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
          <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-primary mb-1">Explanation</p>
            <p className="text-sm text-muted-foreground">{explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};
