import { motion } from 'framer-motion';

export const ChallengeModeIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Stopwatch body */}
    <circle cx="40" cy="44" r="22" className="fill-mode-challenge/10 stroke-mode-challenge/50" strokeWidth="1.5" />
    <circle cx="40" cy="44" r="18" className="stroke-mode-challenge/20" strokeWidth="1" />
    {/* Button top */}
    <rect x="37" y="18" width="6" height="6" rx="2" className="fill-mode-challenge/30 stroke-mode-challenge/50" strokeWidth="1" />
    {/* Watch hands */}
    <line x1="40" y1="44" x2="40" y2="30" className="stroke-mode-challenge/60" strokeWidth="2" strokeLinecap="round" />
    <motion.line x1="40" y1="44" x2="52" y2="40" className="stroke-mode-challenge/40" strokeWidth="1.5" strokeLinecap="round"
      animate={{ rotate: [0, 360] }}
      transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
      style={{ transformOrigin: '40px 44px' }}
    />
    <circle cx="40" cy="44" r="2" className="fill-mode-challenge/60" />
    {/* Lightning bolt */}
    <motion.g
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1.05, 0.95] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
      style={{ transformOrigin: '62px 22px' }}
    >
      <path d="M58 15 L55 24 L60 24 L57 33 L65 21 L60 21 L63 15 Z" className="fill-mode-challenge/60 stroke-mode-challenge/80" strokeWidth="0.5" />
    </motion.g>
  </svg>
);
