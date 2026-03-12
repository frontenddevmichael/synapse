import { motion } from 'framer-motion';

export const RoomPortalIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Door frame */}
    <rect x="55" y="30" width="90" height="130" rx="8" className="fill-muted/40 stroke-border" strokeWidth="1.5" />
    {/* Inner portal glow */}
    <motion.rect
      x="65" y="38" width="70" height="114" rx="4"
      className="fill-primary/10"
      animate={{ opacity: [0.1, 0.25, 0.1] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
    />
    {/* Door handle */}
    <circle cx="125" cy="100" r="4" className="fill-primary/60" />
    {/* Door slightly ajar — light rays */}
    <motion.path
      d="M100 50 L110 25" className="stroke-primary/40" strokeWidth="1.5" strokeLinecap="round"
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ repeat: Infinity, duration: 2.5 }}
    />
    <motion.path
      d="M90 45 L85 20" className="stroke-primary/30" strokeWidth="1.5" strokeLinecap="round"
      animate={{ opacity: [0.2, 0.6, 0.2] }}
      transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
    />
    {/* Floating room code */}
    <motion.g
      animate={{ y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
    >
      <rect x="60" y="5" width="80" height="22" rx="11" className="fill-primary/15 stroke-primary/30" strokeWidth="1" />
      <text x="100" y="20" textAnchor="middle" className="fill-primary" fontSize="10" fontFamily="monospace" fontWeight="700">ABC123</text>
    </motion.g>
    {/* Step line */}
    <rect x="55" y="158" width="90" height="4" rx="2" className="fill-muted-foreground/15" />
  </svg>
);
