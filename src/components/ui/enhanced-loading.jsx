import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Spinner aprimorado com micro-interações
export const EnhancedSpinner = ({ 
  size = 'md', 
  className = '',
  color = 'primary',
  speed = 'normal'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-primary',
    success: 'border-success',
    warning: 'border-warning',
    error: 'border-error',
    muted: 'border-muted-foreground'
  };

  const speedConfig = {
    slow: 2,
    normal: 1,
    fast: 0.5
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ 
        duration: speedConfig[speed], 
        repeat: Infinity, 
        ease: "linear" 
      }}
      className={cn(
        'border-2 border-t-transparent rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
};

// Skeleton aprimorado com animação
export const EnhancedSkeleton = ({ 
  className = '',
  variant = 'default',
  animate = true
}) => {
  const variants = {
    default: 'h-4 bg-muted-foreground/20 rounded',
    card: 'bg-muted rounded-lg p-6 space-y-4',
    text: 'h-4 bg-muted-foreground/20 rounded w-3/4',
    title: 'h-6 bg-muted-foreground/20 rounded w-1/2',
    avatar: 'h-10 w-10 bg-muted-foreground/20 rounded-full'
  };

  const Component = animate ? motion.div : 'div';
  const animationProps = animate ? {
    animate: { 
      opacity: [0.5, 1, 0.5],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  } : {};

  return (
    <Component
      className={cn(variants[variant], className)}
      {...animationProps}
    />
  );
};

// Loading overlay com micro-interações
export const EnhancedLoadingOverlay = ({ 
  isLoading, 
  children, 
  message = 'Carregando...',
  variant = 'default'
}) => {
  if (!isLoading) return children;

  const variants = {
    default: 'bg-background/80 backdrop-blur-sm',
    dark: 'bg-black/50 backdrop-blur-sm',
    light: 'bg-white/80 backdrop-blur-sm'
  };

  return (
    <div className="relative">
      {children}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'absolute inset-0 flex items-center justify-center z-50',
          variants[variant]
        )}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 30
          }}
          className="flex flex-col items-center space-y-4"
        >
          <EnhancedSpinner size="lg" />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground"
          >
            {message}
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Loading dots animados
export const LoadingDots = ({ 
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    muted: 'bg-muted-foreground'
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn(
            'rounded-full',
            sizeClasses[size],
            colorClasses[color]
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

// Progress bar animada
export const AnimatedProgress = ({ 
  value = 0,
  max = 100,
  className = '',
  showPercentage = false,
  animated = true
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">Progresso</span>
        {showPercentage && (
          <motion.span
            key={percentage}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm font-medium"
          >
            {Math.round(percentage)}%
          </motion.span>
        )}
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={animated ? {
            duration: 0.8,
            ease: 'easeOut'
          } : { duration: 0 }}
        />
      </div>
    </div>
  );
};
