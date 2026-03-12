import { motion } from 'framer-motion';

export const EmptyDeskIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Desk surface */}
    <rect x="30" y="110" width="180" height="8" rx="4" className="fill-muted/60" />
    {/* Desk legs */}
    <rect x="50" y="118" width="6" height="40" rx="3" className="fill-muted/40" />
    <rect x="184" y="118" width="6" height="40" rx="3" className="fill-muted/40" />
    {/* Empty coffee mug */}
    <g>
      <rect x="155" y="85" width="25" height="25" rx="4" className="fill-muted/30 stroke-border" strokeWidth="1" />
      <path d="M180 92 C188 92, 188 103, 180 103" className="stroke-border" strokeWidth="1" fill="none" />
    </g>
    {/* Single pen */}
    <rect x="75" y="95" width="50" height="4" rx="2" className="fill-muted-foreground/20" transform="rotate(-8 100 97)" />
    <rect x="73" y="94" width="6" height="6" rx="1" className="fill-primary/30" transform="rotate(-8 76 97)" />
    {/* Floating "+" spark */}
    <motion.g
      animate={{ y: [0, -6, 0], opacity: [0.4, 0.9, 0.4] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
    >
      <circle cx="120" cy="55" r="14" className="fill-primary/10" />
      <line x1="120" y1="48" x2="120" y2="62" className="stroke-primary/60" strokeWidth="2" strokeLinecap="round" />
      <line x1="113" y1="55" x2="127" y2="55" className="stroke-primary/60" strokeWidth="2" strokeLinecap="round" />
    </motion.g>
    {/* Subtle shadow */}
    <ellipse cx="120" cy="162" rx="70" ry="4" className="fill-muted-foreground/5" />
  </svg>
);
