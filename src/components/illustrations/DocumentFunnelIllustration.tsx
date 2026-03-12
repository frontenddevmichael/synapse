import { motion } from 'framer-motion';

export const DocumentFunnelIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Document falling in */}
    <motion.g
      animate={{ y: [0, 8, 0], rotate: [-3, 3, -3] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
    >
      <rect x="65" y="10" width="70" height="50" rx="6" className="fill-card stroke-border" strokeWidth="1.5" />
      <rect x="78" y="22" width="44" height="4" rx="2" className="fill-muted-foreground/25" />
      <rect x="78" y="32" width="35" height="4" rx="2" className="fill-muted-foreground/20" />
      <rect x="78" y="42" width="40" height="4" rx="2" className="fill-muted-foreground/15" />
    </motion.g>
    {/* Funnel / portal */}
    <path d="M50 80 L100 130 L150 80" className="stroke-primary/40" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <motion.ellipse
      cx="100" cy="80" rx="50" ry="10"
      className="fill-primary/10 stroke-primary/25"
      strokeWidth="1.5"
      animate={{ scaleX: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
    />
    {/* Particles being absorbed */}
    <motion.circle cx="85" cy="95" r="2.5" className="fill-primary/50"
      animate={{ y: [0, 15, 30], opacity: [0.8, 0.4, 0], scale: [1, 0.6, 0.2] }}
      transition={{ repeat: Infinity, duration: 2, delay: 0 }}
    />
    <motion.circle cx="115" cy="92" r="2" className="fill-primary/40"
      animate={{ y: [0, 18, 35], opacity: [0.7, 0.3, 0], scale: [1, 0.5, 0.1] }}
      transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
    />
    <motion.circle cx="100" cy="98" r="3" className="fill-primary/60"
      animate={{ y: [0, 12, 25], opacity: [0.9, 0.4, 0], scale: [1, 0.7, 0.3] }}
      transition={{ repeat: Infinity, duration: 2, delay: 1.2 }}
    />
    {/* Output indicator */}
    <motion.circle cx="100" cy="145" r="6" className="fill-primary/20 stroke-primary/40" strokeWidth="1"
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
      transition={{ repeat: Infinity, duration: 2.5 }}
    />
    <circle cx="100" cy="145" r="2" className="fill-primary/60" />
  </svg>
);
