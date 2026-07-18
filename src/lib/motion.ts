import { Variants, Transition } from 'framer-motion';

// Shared motion curves
export const easeOutCubic: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const easeInOutDefault: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(4px)', // Expensive on Safari but acceptable for short durations
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: easeOutCubic,
    } as Transition,
  },
};

export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: easeOutCubic,
    } as Transition,
  },
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: easeOutCubic,
    } as Transition,
  },
};

export const slideUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOutCubic,
    } as Transition,
  },
};

export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

export const viewport = {
  once: true,
  margin: '-100px',
};

export const viewportEager = {
  once: true,
  margin: '-50px',
};

export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
};

// Page-level enter/exit transitions
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 16,
    filter: 'blur(4px)', // Expensive on Safari but acceptable for short durations
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: easeOutCubic,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    filter: 'blur(4px)',
    transition: {
      duration: 0.25,
      ease: easeOutCubic,
    },
  },
};

// Synaptic Burst — the signature achievement moment
export const synapticBurst: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
    filter: 'blur(12px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: easeOutExpo,
    },
  },
};
