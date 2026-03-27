import { Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface PersonalBestProps {
  currentScore: number;
  previousBest: number | null;
  isNewBest: boolean;
}

export function PersonalBest({ currentScore, previousBest, isNewBest }: PersonalBestProps) {
  if (previousBest === null) return null;

  const improvement = currentScore - previousBest;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
      className="flex items-center gap-2 text-sm"
    >
      {isNewBest ? (
        <span className="flex items-center gap-1.5 text-gold font-bold">
          <Trophy className="h-4 w-4" />
          New personal best!
        </span>
      ) : improvement > 0 ? (
        <span className="flex items-center gap-1.5 text-success font-medium">
          <TrendingUp className="h-4 w-4" />
          +{improvement}% from last attempt
        </span>
      ) : (
        <span className="text-muted-foreground">
          Personal best: {previousBest}%
        </span>
      )}
    </motion.div>
  );
}
