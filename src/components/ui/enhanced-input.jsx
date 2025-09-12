import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const EnhancedInput = React.forwardRef(({ 
  className, 
  type = 'text',
  status = 'default', // 'default', 'success', 'error', 'warning'
  showStatusIcon = true,
  children,
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const statusConfig = {
    default: {
      border: 'border-input',
      focus: 'focus:border-primary',
      icon: null,
      iconColor: ''
    },
    success: {
      border: 'border-success',
      focus: 'focus:border-success',
      icon: CheckCircle,
      iconColor: 'text-success'
    },
    error: {
      border: 'border-error',
      focus: 'focus:border-error',
      icon: XCircle,
      iconColor: 'text-error'
    },
    warning: {
      border: 'border-warning',
      focus: 'focus:border-warning',
      icon: AlertCircle,
      iconColor: 'text-warning'
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="relative">
      <motion.input
        ref={ref}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
          config.border,
          config.focus,
          isFocused && 'ring-2 ring-primary/20',
          className
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.15 }}
        {...props}
      />
      
      {/* Status Icon */}
      <AnimatePresence>
        {showStatusIcon && StatusIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <StatusIcon className={cn('h-4 w-4', config.iconColor)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus indicator */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left"
          />
        )}
      </AnimatePresence>
    </div>
  );
});

EnhancedInput.displayName = 'EnhancedInput';

export { EnhancedInput };
