import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Spinner básico
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(
        'border-2 border-primary border-t-transparent rounded-full',
        sizeClasses[size],
        className
      )}
    />
  );
};

// Skeleton para cards
export const CardSkeleton = ({ className = '' }) => (
  <div className={cn('animate-pulse', className)}>
    <div className="bg-muted rounded-lg p-6 space-y-4">
      <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
      <div className="h-8 bg-muted-foreground/20 rounded w-1/2"></div>
      <div className="h-3 bg-muted-foreground/20 rounded w-full"></div>
    </div>
  </div>
);

// Skeleton para tabelas
export const TableSkeleton = ({ rows = 5, className = '' }) => (
  <div className={cn('animate-pulse space-y-3', className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        <div className="h-4 bg-muted-foreground/20 rounded flex-1"></div>
        <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
        <div className="h-4 bg-muted-foreground/20 rounded w-16"></div>
      </div>
    ))}
  </div>
);

// Loading overlay
export const LoadingOverlay = ({ isLoading, children, message = 'Carregando...' }) => {
  if (!isLoading) return children;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Loading page
export const LoadingPage = ({ message = 'Carregando...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Spinner size="xl" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Loading button
export const LoadingButton = ({ isLoading, children, loadingText = 'Carregando...', ...props }) => (
  <button
    disabled={isLoading}
    className="relative"
    {...props}
  >
    {isLoading && (
      <div className="absolute inset-0 flex items-center justify-center">
        <Spinner size="sm" className="text-current" />
      </div>
    )}
    <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
      {isLoading ? loadingText : children}
    </span>
  </button>
);
