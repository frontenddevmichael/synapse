import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RetryMistakesButtonProps {
  incorrectCount: number;
  onClick: () => void;
}

export function RetryMistakesButton({ incorrectCount, onClick }: RetryMistakesButtonProps) {
  if (incorrectCount === 0) return null;

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="gap-2 font-semibold h-11 w-full sm:w-auto"
    >
      <RotateCcw className="h-4 w-4" />
      Retry {incorrectCount} mistake{incorrectCount !== 1 ? 's' : ''}
    </Button>
  );
}
