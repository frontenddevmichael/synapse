import { motion } from 'framer-motion';

export const EmptyDeckIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Empty card stack — faded outlines */}
    <rect x="45" y="60" width="110" height="70" rx="8" className="stroke-border/30" strokeWidth="1.5" strokeDasharray="6 4" fill="none" />
    <rect x="50" y="55" width="110" height="70" rx="8" className="stroke-border/40" strokeWidth="1.5" strokeDasharray="6 4" fill="none" />
    <rect x="55" y="50" width="110" height="70" rx="8" className="stroke-border/50" strokeWidth="1.5" fill="none" />
    {/* Empty bookmark icon in center */}
    <motion.g
      animate={{ y: [0, -3, 0] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
    >
      <path d="M92 72 L92 98 L100 92 L108 98 L108 72 Z" className="stroke-muted-foreground/30" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    </motion.g>
    {/* Subtle dust particles */}
    <motion.circle cx="60" cy="40" r="1.5" className="fill-muted-foreground/15"
      animate={{ y: [0, -5, 0], opacity: [0.1, 0.3, 0.1] }}
      transition={{ repeat: Infinity, duration: 3 }}
    />
    <motion.circle cx="150" cy="35" r="2" className="fill-muted-foreground/10"
      animate={{ y: [0, -4, 0], opacity: [0.1, 0.25, 0.1] }}
      transition={{ repeat: Infinity, duration: 3.5, delay: 1 }}
    />
  </svg>
);
