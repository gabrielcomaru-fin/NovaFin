import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { Spinner } from '@/components/ui/loading';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
        error: 'bg-error text-error-foreground hover:bg-error/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
      animation: {
        none: '',
        subtle: 'hover:scale-105 active:scale-95',
        bounce: 'hover:scale-110 active:scale-90',
        glow: 'hover:shadow-lg hover:shadow-primary/25',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'subtle',
    },
  },
);

const EnhancedButton = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  animation,
  asChild = false, 
  loading = false,
  loadingText = 'Carregando...',
  children,
  disabled,
  ...props 
}, ref) => {
  const { variants } = useMicroInteractions();
  const Comp = asChild ? Slot : motion.button;
  
  const isDisabled = disabled || loading;

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, animation, className }))}
      ref={ref}
      disabled={isDisabled}
      variants={variants.button}
      initial="initial"
      whileHover={!isDisabled ? "hover" : undefined}
      whileTap={!isDisabled ? "tap" : undefined}
      {...props}
    >
      {/* Ripple effect overlay */}
      {!isDisabled && (
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-md"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{ 
            scale: 1, 
            opacity: [0, 0.3, 0],
            transition: { duration: 0.3 }
          }}
        />
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {loading && (
          <Spinner size="sm" className="text-current" />
        )}
        {loading ? loadingText : children}
      </span>
    </Comp>
  );
});

EnhancedButton.displayName = 'EnhancedButton';

export { EnhancedButton, buttonVariants };
