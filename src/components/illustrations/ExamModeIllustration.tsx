import { motion } from 'framer-motion';

export const ExamModeIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Lock body */}
    <rect x="24" y="38" width="32" height="26" rx="6" className="fill-mode-exam/15 stroke-mode-exam/50" strokeWidth="1.5" />
    {/* Lock shackle */}
    <path d="M30 38 L30 28 C30 20, 50 20, 50 28 L50 38" className="stroke-mode-exam/50" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Keyhole — eye shape */}
    <motion.g
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
      style={{ transformOrigin: '40px 49px' }}
    >
      {/* Eye outline */}
      <path d="M32 49 C36 43, 44 43, 48 49 C44 55, 36 55, 32 49 Z" className="fill-mode-exam/20 stroke-mode-exam/40" strokeWidth="1" />
      {/* Pupil */}
      <circle cx="40" cy="49" r="3" className="fill-mode-exam/60" />
      {/* Glint */}
      <circle cx="41.5" cy="47.5" r="1" className="fill-background/80" />
    </motion.g>
    {/* Subtle radiating lines */}
    <motion.line x1="40" y1="10" x2="40" y2="14" className="stroke-mode-exam/20" strokeWidth="1" strokeLinecap="round"
      animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 3 }}
    />
    <motion.line x1="56" y1="18" x2="54" y2="21" className="stroke-mode-exam/15" strokeWidth="1" strokeLinecap="round"
      animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
    />
    <motion.line x1="24" y1="18" x2="26" y2="21" className="stroke-mode-exam/15" strokeWidth="1" strokeLinecap="round"
      animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ repeat: Infinity, duration: 3, delay: 1 }}
    />
  </svg>
);
