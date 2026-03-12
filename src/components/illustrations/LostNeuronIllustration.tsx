import { motion } from 'framer-motion';

export const LostNeuronIllustration = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Disconnected synapses — dashed broken lines */}
    <motion.path d="M60 80 C80 60, 100 90, 100 90" className="stroke-muted-foreground/20" strokeWidth="1.5" strokeDasharray="4 6" fill="none"
      animate={{ pathLength: [0, 1, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
    />
    <motion.path d="M160 60 C180 80, 200 50, 200 50" className="stroke-muted-foreground/20" strokeWidth="1.5" strokeDasharray="4 6" fill="none"
      animate={{ pathLength: [0, 1, 0] }}
      transition={{ repeat: Infinity, duration: 4, delay: 1 }}
    />
    <motion.path d="M100 170 C80 190, 60 170, 50 180" className="stroke-muted-foreground/15" strokeWidth="1.5" strokeDasharray="4 6" fill="none"
      animate={{ pathLength: [0, 1, 0] }}
      transition={{ repeat: Infinity, duration: 4, delay: 2 }}
    />
    <motion.path d="M170 160 C190 180, 210 160, 220 170" className="stroke-muted-foreground/15" strokeWidth="1.5" strokeDasharray="4 6" fill="none"
      animate={{ pathLength: [0, 1, 0] }}
      transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
    />

    {/* Dead-end nodes */}
    <circle cx="50" cy="80" r="6" className="fill-muted-foreground/10 stroke-muted-foreground/20" strokeWidth="1" />
    <circle cx="205" cy="48" r="5" className="fill-muted-foreground/10 stroke-muted-foreground/15" strokeWidth="1" />
    <circle cx="45" cy="185" r="5" className="fill-muted-foreground/8 stroke-muted-foreground/12" strokeWidth="1" />
    <circle cx="225" cy="170" r="4" className="fill-muted-foreground/8 stroke-muted-foreground/12" strokeWidth="1" />

    {/* Central confused neuron */}
    <motion.g
      animate={{ y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
    >
      {/* Neuron body */}
      <circle cx="130" cy="110" r="28" className="fill-primary/10 stroke-primary/30" strokeWidth="2" />
      <circle cx="130" cy="110" r="18" className="fill-primary/15" />
      {/* Confused face */}
      {/* Eyes */}
      <circle cx="122" cy="105" r="3" className="fill-primary/60" />
      <circle cx="138" cy="105" r="3" className="fill-primary/60" />
      {/* Squiggly mouth */}
      <path d="M120 120 C124 117, 128 123, 132 118, 136 123, 140 120" className="stroke-primary/50" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Question mark floating above */}
      <motion.text
        x="130" y="75" textAnchor="middle"
        className="fill-primary/40" fontSize="20" fontFamily="serif" fontWeight="700"
        animate={{ opacity: [0.2, 0.6, 0.2], y: [75, 70, 75] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        ?
      </motion.text>
    </motion.g>

    {/* Broken connection sparks */}
    <motion.circle cx="95" cy="95" r="2" className="fill-primary/30"
      animate={{ opacity: [0, 0.8, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
    />
    <motion.circle cx="165" cy="100" r="2" className="fill-primary/30"
      animate={{ opacity: [0, 0.8, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, delay: 0.7 }}
    />
  </svg>
);
