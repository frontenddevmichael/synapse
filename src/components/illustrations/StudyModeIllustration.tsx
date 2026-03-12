import { motion } from 'framer-motion';

export const StudyModeIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Open book */}
    <path d="M15 55 L15 25 C15 25, 25 20, 40 22 L40 52 C40 52, 28 50, 15 55 Z" className="fill-mode-study/15 stroke-mode-study/50" strokeWidth="1.5" />
    <path d="M65 55 L65 25 C65 25, 55 20, 40 22 L40 52 C40 52, 52 50, 65 55 Z" className="fill-mode-study/10 stroke-mode-study/50" strokeWidth="1.5" />
    {/* Text lines in book */}
    <rect x="21" y="32" width="14" height="2" rx="1" className="fill-mode-study/30" />
    <rect x="21" y="38" width="12" height="2" rx="1" className="fill-mode-study/20" />
    <rect x="45" y="32" width="14" height="2" rx="1" className="fill-mode-study/25" />
    <rect x="45" y="38" width="10" height="2" rx="1" className="fill-mode-study/15" />
    {/* Lightbulb above */}
    <motion.g
      animate={{ opacity: [0.5, 1, 0.5], y: [0, -2, 0] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
    >
      <circle cx="40" cy="12" r="7" className="fill-mode-study/20 stroke-mode-study/40" strokeWidth="1" />
      <line x1="40" y1="9" x2="40" y2="15" className="stroke-mode-study/60" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="37" y1="12" x2="43" y2="12" className="stroke-mode-study/60" strokeWidth="1.5" strokeLinecap="round" />
    </motion.g>
    {/* Rays */}
    <motion.line x1="40" y1="2" x2="40" y2="0" className="stroke-mode-study/30" strokeWidth="1" strokeLinecap="round"
      animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2 }}
    />
    <motion.line x1="48" y1="5" x2="50" y2="3" className="stroke-mode-study/25" strokeWidth="1" strokeLinecap="round"
      animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
    />
    <motion.line x1="32" y1="5" x2="30" y2="3" className="stroke-mode-study/25" strokeWidth="1" strokeLinecap="round"
      animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
    />
  </svg>
);
