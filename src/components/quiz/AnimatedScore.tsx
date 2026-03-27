import CountUp from 'react-countup';

interface AnimatedScoreProps {
  score: number;
  className?: string;
  onEnd?: () => void;
}

export function AnimatedScore({ score, className, onEnd }: AnimatedScoreProps) {
  return (
    <span className={className}>
      <CountUp
        end={score}
        duration={1.8}
        suffix="%"
        easingFn={(t, b, c, d) => {
          // Decelerate easing
          t /= d;
          return -c * t * (t - 2) + b;
        }}
        onEnd={onEnd}
      />
    </span>
  );
}
