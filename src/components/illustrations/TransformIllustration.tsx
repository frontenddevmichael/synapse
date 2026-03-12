import { motion } from 'framer-motion';

export const TransformIllustration = ({ className = '' }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <svg viewBox="0 0 480 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* Document page — left side */}
      <motion.g
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <rect x="40" y="80" width="140" height="180" rx="12" className="fill-muted/60 stroke-border" strokeWidth="1.5" />
        {/* Text lines */}
        <rect x="60" y="110" width="100" height="6" rx="3" className="fill-muted-foreground/20" />
        <rect x="60" y="125" width="80" height="6" rx="3" className="fill-muted-foreground/20" />
        <rect x="60" y="140" width="95" height="6" rx="3" className="fill-muted-foreground/20" />
        <rect x="60" y="155" width="60" height="6" rx="3" className="fill-muted-foreground/20" />
        <rect x="60" y="175" width="100" height="6" rx="3" className="fill-muted-foreground/15" />
        <rect x="60" y="190" width="70" height="6" rx="3" className="fill-muted-foreground/15" />
        <rect x="60" y="205" width="90" height="6" rx="3" className="fill-muted-foreground/15" />
        {/* Corner fold */}
        <path d="M180 80 L180 105 L155 80 Z" className="fill-muted stroke-border" strokeWidth="1" />
      </motion.g>

      {/* Arrow / transformation energy beam */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <path d="M200 170 C230 170, 240 140, 260 130" className="stroke-primary/60" strokeWidth="2" strokeDasharray="6 4" fill="none" />
        <path d="M200 170 C230 170, 240 200, 260 210" className="stroke-primary/60" strokeWidth="2" strokeDasharray="6 4" fill="none" />
        <path d="M200 170 C230 170, 240 170, 260 170" className="stroke-primary/60" strokeWidth="2" strokeDasharray="6 4" fill="none" />
        {/* Sparkle particles */}
        <motion.circle
          cx="230" cy="155" r="3"
          className="fill-primary/80"
          animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.3, 0.8] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <motion.circle
          cx="240" cy="180" r="2"
          className="fill-primary/60"
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
        />
        <motion.circle
          cx="225" cy="195" r="2.5"
          className="fill-primary/70"
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.3, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 1 }}
        />
      </motion.g>

      {/* Quiz cards — fanning out right side */}
      <motion.g
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
      >
        {/* Back card */}
        <rect x="290" y="105" width="150" height="100" rx="10" className="fill-card stroke-border/60" strokeWidth="1" transform="rotate(6 365 155)" />
        {/* Middle card */}
        <rect x="280" y="95" width="150" height="100" rx="10" className="fill-card stroke-border/60" strokeWidth="1" transform="rotate(-3 355 145)" />
        {/* Front card */}
        <g>
          <rect x="270" y="90" width="155" height="110" rx="10" className="fill-card stroke-primary/30" strokeWidth="1.5" />
          {/* Question mark */}
          <text x="295" y="130" className="fill-primary font-black" fontSize="28" fontFamily="serif">?</text>
          {/* Option dots */}
          <circle cx="295" cy="150" r="4" className="fill-primary/30" />
          <rect x="307" y="147" width="80" height="5" rx="2.5" className="fill-muted-foreground/20" />
          <circle cx="295" cy="168" r="4" className="fill-primary/20" />
          <rect x="307" y="165" width="65" height="5" rx="2.5" className="fill-muted-foreground/15" />
        </g>
      </motion.g>

      {/* Floating sparkles */}
      <motion.circle
        cx="450" cy="80" r="4"
        className="fill-primary/40"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="50" cy="300" r="3"
        className="fill-primary/30"
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 1 }}
      />
      <motion.rect
        x="430" y="280" width="8" height="8" rx="2"
        className="fill-primary/20"
        animate={{ rotate: [0, 45, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      />
    </svg>
  </div>
);
