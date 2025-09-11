import React from 'react';
import { Info } from 'lucide-react';

export function InfoTooltip({ content }) {
  return (
    <span className="relative inline-flex items-center group">
      <Info className="h-3.5 w-3.5 text-muted-foreground/70 cursor-help" />
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-md border bg-popover p-2 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
        {content}
      </span>
    </span>
  );
}


