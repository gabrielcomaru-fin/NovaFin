import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';

const Card = React.forwardRef(({ 
  className, 
  hover = true,
  animation = 'subtle',
  children,
  ...props 
}, ref) => {
  const { variants } = useMicroInteractions();
  
  const cardVariants = animation === 'subtle' ? variants.cardSubtle : variants.card;
  
  return (
    <motion.div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow duration-200',
        hover && 'cursor-pointer',
        className
      )}
      variants={cardVariants}
      initial="initial"
      whileHover={hover ? "hover" : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: 0.1 }}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <motion.h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: 0.15 }}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <motion.p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: 0.2 }}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <motion.div 
    ref={ref} 
    className={cn('p-6 pt-0', className)} 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: 0.25 }}
    {...props} 
  />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: 0.3 }}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
