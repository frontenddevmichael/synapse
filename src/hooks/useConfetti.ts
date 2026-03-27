import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti() {
  const firePerfectScore = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#2dd4bf', '#fbbf24', '#60a5fa'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#2dd4bf', '#fbbf24', '#60a5fa'],
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2dd4bf', '#fbbf24', '#60a5fa', '#f472b6'],
    });

    frame();
  }, []);

  const fireSmall = useCallback(() => {
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#2dd4bf', '#fbbf24'],
    });
  }, []);

  return { firePerfectScore, fireSmall };
}
