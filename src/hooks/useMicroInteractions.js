import { useCallback } from 'react';

/**
 * Hook para gerenciar micro-interações consistentes
 * Fornece configurações padronizadas para animações
 */
export const useMicroInteractions = () => {
  // Configurações de transição padrão
  const transitions = {
    // Transições suaves para hover
    smooth: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    },
    
    // Transições rápidas para feedback imediato
    quick: {
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1]
    },
    
    // Transições para elementos que aparecem/desaparecem
    fade: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    },
    
    // Transições para elementos que se movem
    slide: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1]
    },
    
    // Transições para elementos que mudam de tamanho
    scale: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  };

  // Variantes de animação para diferentes elementos
  const variants = {
    // Botões
    button: {
      initial: { scale: 1 },
      hover: { 
        scale: 1.02,
        transition: transitions.quick
      },
      tap: { 
        scale: 0.98,
        transition: transitions.quick
      }
    },

    // Cards
    card: {
      initial: { 
        scale: 1,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
      },
      hover: { 
        scale: 1.02,
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        transition: transitions.smooth
      }
    },

    // Cards com elevação mais sutil
    cardSubtle: {
      initial: { 
        scale: 1,
        y: 0
      },
      hover: { 
        scale: 1.01,
        y: -2,
        transition: transitions.smooth
      }
    },

    // Elementos que aparecem
    fadeIn: {
      initial: { 
        opacity: 0,
        y: 10
      },
      animate: { 
        opacity: 1,
        y: 0,
        transition: transitions.fade
      },
      exit: { 
        opacity: 0,
        y: -10,
        transition: transitions.fade
      }
    },

    // Elementos que deslizam
    slideIn: {
      initial: { 
        opacity: 0,
        x: -20
      },
      animate: { 
        opacity: 1,
        x: 0,
        transition: transitions.slide
      },
      exit: { 
        opacity: 0,
        x: 20,
        transition: transitions.slide
      }
    },

    // Elementos que crescem
    scaleIn: {
      initial: { 
        opacity: 0,
        scale: 0.9
      },
      animate: { 
        opacity: 1,
        scale: 1,
        transition: transitions.scale
      },
      exit: { 
        opacity: 0,
        scale: 0.9,
        transition: transitions.scale
      }
    },

    // Loading states
    loading: {
      initial: { opacity: 0.5 },
      animate: { 
        opacity: [0.5, 1, 0.5],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }
    },

    // Pulse para elementos importantes
    pulse: {
      initial: { scale: 1 },
      animate: { 
        scale: [1, 1.05, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }
    },

    // Shake para erros
    shake: {
      initial: { x: 0 },
      animate: { 
        x: [-10, 10, -10, 10, 0],
        transition: {
          duration: 0.5,
          ease: 'easeInOut'
        }
      }
    }
  };

  // Função para criar animações personalizadas
  const createCustomAnimation = useCallback((config) => {
    return {
      initial: config.initial || {},
      animate: config.animate || {},
      exit: config.exit || {},
      transition: config.transition || transitions.smooth
    };
  }, [transitions]);

  // Função para criar stagger animations
  const createStaggerAnimation = useCallback((delay = 0.1) => {
    return {
      initial: { opacity: 0, y: 20 },
      animate: { 
        opacity: 1, 
        y: 0,
        transition: {
          ...transitions.fade,
          delay
        }
      }
    };
  }, [transitions]);

  return {
    transitions,
    variants,
    createCustomAnimation,
    createStaggerAnimation
  };
};
