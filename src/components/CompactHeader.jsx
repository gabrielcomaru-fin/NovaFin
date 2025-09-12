import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function CompactHeader({ 
  title, 
  subtitle, 
  actionButton, 
  children 
}) {
  return (
    <div className="space-y-3">
      {/* Header compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {actionButton && (
          <div className="flex-shrink-0">
            {actionButton}
          </div>
        )}
      </div>
      
      {/* Conteúdo adicional (filtros, etc.) */}
      {children && (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
