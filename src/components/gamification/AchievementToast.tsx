import { useEffect } from 'react';
import { Trophy, Star, Crown, Target, Flame, Zap, Medal, Clock, Home, Users, X, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface AchievementToastProps {
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  onClose: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy, star: Star, crown: Crown, target: Target,
  flame: Flame, zap: Zap, medal: Medal, clock: Clock, home: Home, users: Users,
};

export function AchievementToast({ name, description, icon, xpReward, onClose }: AchievementToastProps) {
  const Icon = iconMap[icon] || Trophy;

  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
        {/* Full-screen backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/60 backdrop-blur-md pointer-events-auto"
          onClick={onClose}
        />

        {/* Radial glow */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 0.3 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute w-[400px] h-[400px] rounded-full bg-gold/20 blur-3xl"
        />

        {/* Achievement card */}
        <motion.div
          initial={{ scale: 0.2, y: 40, opacity: 0, rotateX: 30 }}
          animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -30 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 }}
          className="relative pointer-events-auto z-10"
        >
          <div className="relative bg-card border-2 border-gold/40 rounded-3xl shadow-2xl p-10 flex flex-col items-center text-center max-w-sm mx-4">
            {/* Shimmer line */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5" />
            </div>

            {/* Label */}
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xs font-black uppercase tracking-[0.25em] text-gold mb-6 relative"
            >
              🏆 Achievement Unlocked
            </motion.p>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
              className="h-20 w-20 rounded-2xl flex items-center justify-center mb-5 bg-gold/15 border-2 border-gold/30 relative"
            >
              <Icon className="h-10 w-10 text-gold" />
              <div className="absolute inset-0 rounded-2xl legendary-glow" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-black text-2xl tracking-tight mb-2 relative"
            >
              {name}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground mb-4 relative"
            >
              {description}
            </motion.p>

            {/* XP reward */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: 'spring' }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold relative"
            >
              <Zap className="h-4 w-4" />
              +{xpReward} XP
            </motion.div>

            {/* Dismiss */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground relative"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
