import { useEffect } from 'react';

interface UseKeyboardNavProps {
  options: string[];
  onSelect: (option: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  enabled: boolean;
  isLastQuestion: boolean;
  canSubmit: boolean;
  disabled?: boolean;
}

export function useKeyboardNav({
  options,
  onSelect,
  onNext,
  onPrev,
  onSubmit,
  enabled,
  isLastQuestion,
  canSubmit,
  disabled,
}: UseKeyboardNavProps) {
  useEffect(() => {
    if (!enabled || disabled) return;

    const handler = (e: KeyboardEvent) => {
      // A/B/C/D or 1/2/3/4 to select
      const letterIndex = e.key.toUpperCase().charCodeAt(0) - 65; // A=0, B=1...
      const numberIndex = parseInt(e.key) - 1; // 1=0, 2=1...

      if (letterIndex >= 0 && letterIndex < options.length) {
        e.preventDefault();
        onSelect(options[letterIndex]);
        return;
      }
      if (numberIndex >= 0 && numberIndex < options.length) {
        e.preventDefault();
        onSelect(options[numberIndex]);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (isLastQuestion && canSubmit) onSubmit();
        else onNext();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        onPrev();
      }
      if (e.key === 'Enter' && isLastQuestion && canSubmit) {
        e.preventDefault();
        onSubmit();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options, onSelect, onNext, onPrev, onSubmit, enabled, isLastQuestion, canSubmit, disabled]);
}
