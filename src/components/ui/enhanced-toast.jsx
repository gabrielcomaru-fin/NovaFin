import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const toastVariants = {
  initial: { 
    opacity: 0, 
    y: 50, 
    scale: 0.9 
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    y: -50, 
    scale: 0.9,
    transition: {
      duration: 0.2
    }
  }
};

const EnhancedToast = ({ 
  id,
  title,
  description,
  type = 'default',
  duration = 5000,
  onClose,
  className,
  ...props 
}) => {
  const typeConfig = {
    default: {
      bg: 'bg-background',
      border: 'border-border',
      icon: Info,
      iconColor: 'text-primary'
    },
    success: {
      bg: 'bg-success-muted',
      border: 'border-success',
      icon: CheckCircle,
      iconColor: 'text-success'
    },
    error: {
      bg: 'bg-error-muted',
      border: 'border-error',
      icon: XCircle,
      iconColor: 'text-error'
    },
    warning: {
      bg: 'bg-warning-muted',
      border: 'border-warning',
      icon: AlertCircle,
      iconColor: 'text-warning'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg',
        config.bg,
        config.border,
        className
      )}
      {...props}
    >
      {/* Icon */}
      <div className="flex items-start space-x-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
        >
          <Icon className={cn('h-5 w-5', config.iconColor)} />
        </motion.div>
        
        {/* Content */}
        <div className="grid gap-1">
          {title && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-semibold"
            >
              {title}
            </motion.div>
          )}
          {description && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm opacity-90"
            >
              {description}
            </motion.div>
          )}
        </div>
      </div>

      {/* Close button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.7, scale: 1 }}
        whileHover={{ opacity: 1, scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </motion.button>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-1 bg-current opacity-30 origin-left"
      />
    </motion.div>
  );
};

// Container para múltiplos toasts
const EnhancedToaster = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <EnhancedToast
            key={toast.id}
            {...toast}
            onClose={() => onClose(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export { EnhancedToast, EnhancedToaster };
