import { useEffect } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface LevelUpOverlayProps {
  level: number;
  show: boolean;
  onClose: () => void;
}

export function LevelUpOverlay({ level, show, onClose }: LevelUpOverlayProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 6000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
        {/* Full-screen flash + backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-auto"
          onClick={onClose}
        >
          {/* Gold flash */}
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-gold/20"
          />
          <div className="absolute inset-0 bg-background/70 backdrop-blur-lg" />
        </motion.div>

        {/* Particle burst */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1, 0.5],
              x: Math.cos((i / 12) * Math.PI * 2) * 200,
              y: Math.sin((i / 12) * Math.PI * 2) * 200,
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
            className="absolute w-3 h-3 rounded-full bg-gold/60"
          />
        ))}

        {/* Central content */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="relative pointer-events-auto z-10 text-center"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Sparkles className="h-8 w-8 text-gold mx-auto mb-4" />
            <p className="text-sm font-black uppercase tracking-[0.3em] text-gold mb-6">
              Level Up!
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.5 }}
            className="relative"
          >
            <div className="h-32 w-32 mx-auto rounded-3xl bg-gold/15 border-3 border-gold/40 flex items-center justify-center mb-6 legendary-glow">
              <span className="font-black text-6xl text-gold">{level}</span>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-lg text-muted-foreground mb-6"
          >
            You've reached a new level!
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
