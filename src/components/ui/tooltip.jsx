import React, { createContext, useContext, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

// Provedor simples — mantém configuração global (p.ex. delay)
const TooltipConfigContext = createContext({ delayDuration: 200 });

export const TooltipProvider = ({ children, delayDuration = 200 }) => {
  const value = useMemo(() => ({ delayDuration }), [delayDuration]);
  return (
    <TooltipConfigContext.Provider value={value}>
      {children}
    </TooltipConfigContext.Provider>
  );
};

// Tooltip raiz mantém estado de aberto/fechado
const TooltipContext = createContext({
  open: false,
  setOpen: () => {},
});

export const Tooltip = ({ children, delayDuration }) => {
  const config = useContext(TooltipConfigContext);
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen, delayDuration: delayDuration ?? config.delayDuration }), [open, delayDuration, config.delayDuration]);
  return (
    <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>
  );
};

export const TooltipTrigger = ({ asChild = false, children, ...props }) => {
  const { setOpen, delayDuration } = useContext(TooltipContext);
  let timeoutId;
  const onEnter = () => {
    timeoutId = setTimeout(() => setOpen(true), delayDuration);
  };
  const onLeave = () => {
    clearTimeout(timeoutId);
    setOpen(false);
  };

  const triggerProps = {
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    onFocus: onEnter,
    onBlur: onLeave,
    ...props,
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, triggerProps);
  }
  return (
    <span {...triggerProps}>
      {children}
    </span>
  );
};

export const TooltipContent = ({ className, side = 'top', children, ...props }) => {
  const { open } = useContext(TooltipContext);
  const sideClasses =
    side === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' :
    side === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
    side === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' :
    'bottom-full mb-2 left-1/2 -translate-x-1/2';
  return (
    <div
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-50 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md transition-opacity',
        open ? 'opacity-100' : 'opacity-0',
        sideClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Legado: manter InfoTooltip existente para compatibilidade
export function InfoTooltip({ content }) {
  return (
    <span className="relative inline-flex items-center group">
      <span className="h-3.5 w-3.5 rounded-full bg-muted text-muted-foreground/70 grid place-items-center text-[10px] cursor-help">i</span>
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-md border bg-popover p-2 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
        {content}
      </span>
    </span>
  );
}

