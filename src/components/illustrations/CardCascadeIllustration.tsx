import { motion } from 'framer-motion';

export const CardCascadeIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Cascading cards with staggered animation */}
    <motion.g
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 0.5 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <rect x="45" y="20" width="110" height="45" rx="8" className="fill-muted/30 stroke-border/40" strokeWidth="1" transform="rotate(-5 100 42)" />
    </motion.g>
    <motion.g
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 0.7 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <rect x="42" y="50" width="115" height="45" rx="8" className="fill-muted/50 stroke-border/50" strokeWidth="1" transform="rotate(2 100 72)" />
    </motion.g>
    <motion.g
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0, duration: 0.4 }}
    >
      <rect x="38" y="80" width="120" height="50" rx="8" className="fill-card stroke-primary/30" strokeWidth="1.5" />
      {/* Question inside */}
      <text x="55" y="102" className="fill-primary font-bold" fontSize="14" fontFamily="serif">?</text>
      <rect x="72" y="95" width="70" height="5" rx="2.5" className="fill-muted-foreground/20" />
      <circle cx="55" cy="116" r="3" className="fill-primary/25" />
      <rect x="65" y="113" width="50" height="4" rx="2" className="fill-muted-foreground/15" />
    </motion.g>
    {/* Sparkle effects */}
    <motion.circle cx="170" cy="40" r="3" className="fill-primary/50"
      animate={{ scale: [0, 1, 0], opacity: [0, 0.8, 0] }}
      transition={{ repeat: Infinity, duration: 2, delay: 0 }}
    />
    <motion.circle cx="25" cy="100" r="2.5" className="fill-primary/40"
      animate={{ scale: [0, 1, 0], opacity: [0, 0.6, 0] }}
      transition={{ repeat: Infinity, duration: 2.5, delay: 1 }}
    />
    <motion.rect x="165" y="120" width="6" height="6" rx="1.5" className="fill-primary/30"
      animate={{ rotate: [0, 90, 0], opacity: [0.3, 0.7, 0.3] }}
      transition={{ repeat: Infinity, duration: 3 }}
    />
    {/* Check mark on completed */}
    <motion.g
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <circle cx="155" cy="145" r="10" className="fill-primary/15" />
      <path d="M149 145 L153 149 L161 141" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </motion.g>
  </svg>
);
