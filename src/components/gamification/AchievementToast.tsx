import { useEffect } from 'react';
import { Trophy, Star, Crown, Target, Flame, Zap, Medal, Clock, Home, Users, X, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none pt-8">
      <motion.div
        initial={{ scale: 0.3, y: -40, opacity: 0, filter: 'blur(8px)' }}
        animate={{ scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="pointer-events-auto"
      >
        <div className="relative bg-card border-2 border-gold/30 rounded-2xl shadow-2xl p-6 flex items-center gap-5 max-w-sm">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gold/5 blur-xl -z-10" />
          
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 bg-gold/10 border border-gold/20">
            <Icon className="h-8 w-8 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-gold mb-1">Achievement Unlocked</p>
            <p className="font-bold text-lg truncate">{name}</p>
            <p className="text-sm text-muted-foreground truncate">{description}</p>
            <p className="text-sm text-primary font-bold mt-1">+{xpReward} XP</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 absolute top-2 right-2 h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
