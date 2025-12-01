// lib/animations/motion-config.ts
import { Variants } from 'framer-motion';

export const motionConfig = {
  // Portal Animations
  portal: {
    entry: {
      initial: { opacity: 0, scale: 0.9, rotateY: -30 },
      animate: { 
        opacity: 1, 
        scale: 1, 
        rotateY: 0,
        transition: {
          duration: 0.8,
          ease: [0.645, 0.045, 0.355, 1]
        }
      },
      exit: { 
        opacity: 0, 
        scale: 1.1, 
        rotateY: 30,
        transition: { duration: 0.5 }
      }
    },

    step: {
      initial: { x: 100, opacity: 0 },
      animate: { 
        x: 0, 
        opacity: 1,
        transition: { duration: 0.5, ease: "easeInOut" }
      },
      exit: { 
        x: -100, 
        opacity: 0,
        transition: { duration: 0.3 }
      }
    },

    unlock: {
      initial: { scale: 0, rotate: -180 },
      animate: {
        scale: [0, 1.2, 1],
        rotate: [180, 0, 0],
        transition: {
          duration: 1,
          times: [0, 0.6, 1],
          ease: [0.645, 0.045, 0.355, 1]
        }
      }
    }
  },

  // Biometric Animations
  biometric: {
    scanning: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },

    emotionChange: {
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },

    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },

  // Quantum Vault Animations
  quantum: {
    timeline: {
      movement: {
        type: "spring" as const,
        stiffness: 100,
        damping: 30,
        mass: 1
      },

      particles: {
        animate: {
          y: [0, -20, 0],
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.5]
        },
        transition: {
          duration: 3,
          repeat: Infinity,
          repeatDelay: Math.random() * 2,
          ease: "easeInOut"
        }
      },

      memoryNode: {
        hover: {
          scale: 1.1,
          z: 50,
          transition: { duration: 0.2 }
        },
        tap: {
          scale: 0.95,
          transition: { duration: 0.1 }
        }
      }
    },

    float: {
      y: [-10, 10],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    }
  },

  // UI Animations
  ui: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { 
        opacity: 1,
        transition: { duration: 0.3 }
      },
      exit: { 
        opacity: 0,
        transition: { duration: 0.2 }
      }
    },

    slideUp: {
      initial: { y: 20, opacity: 0 },
      animate: { 
        y: 0, 
        opacity: 1,
        transition: { duration: 0.4 }
      },
      exit: { 
        y: -20, 
        opacity: 0,
        transition: { duration: 0.3 }
      }
    },

    scaleIn: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { 
        scale: 1, 
        opacity: 1,
        transition: { duration: 0.3 }
      },
      exit: { 
        scale: 0.9, 
        opacity: 0,
        transition: { duration: 0.2 }
      }
    },

    staggerChildren: {
      animate: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2
        }
      }
    }
  },

  // Loading Animations
  loading: {
    spinner: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    },

    dots: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },

    pulse: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};

// Easing functions
export const easings = {
  easeOutCubic: [0.33, 1, 0.68, 1],
  easeInOutCubic: [0.645, 0.045, 0.355, 1],
  easeOutQuart: [0.25, 1, 0.5, 1],
  spring: { type: "spring", stiffness: 300, damping: 30 }
};

// Helper to create staggered animations
export function createStagger(
  delay: number = 0.1,
  duration: number = 0.3
): Variants {
  return {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        staggerChildren: delay
      }
    }
  };
}

// Helper for page transitions
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.645, 0.045, 0.355, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
};

export default motionConfig;