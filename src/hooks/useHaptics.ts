export function useHaptics() {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return {
    correctAnswer: () => vibrate(50),
    wrongAnswer: () => vibrate([50, 50, 50]),
    quizComplete: () => vibrate(200),
    achievementUnlock: () => vibrate([100, 50, 100, 50, 200]),
    tap: () => vibrate(10),
  };
}
