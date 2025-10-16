import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  LogOut,
  DollarSign,
  User,
  Settings,
  Star,
  Calculator,
  Menu,
  X,
  ChevronLeft,
  Target,
  BarChart3,
  Wallet,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Configuração unificada dos itens de navegação
const navItems = [
  { to: '/dashboard', label: 'Resumo Geral', icon: LayoutDashboard },
  { to: '/gastos', label: 'Despesas', icon: Receipt },
  { to: '/receitas', label: 'Receitas', icon: DollarSign },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/projecao-investimentos', label: 'Projeção', icon: Target },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/calculadora', label: 'Calculadora', icon: Calculator },
  { to: '/conquistas', label: 'Conquistas', icon: Trophy },
];

export function UnifiedNavigation({ 
  user, 
  onLogout, 
  isMobile, 
  isOpen, 
  onClose,
  onOpen,
  onCollapseChange
}) {
  const location = useLocation();
  const { user: authUser } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile && isOpen) {
      onClose();
    }
  }, [isMobile, isOpen, onClose, location.pathname]);

  // Atalho de teclado: Ctrl/Cmd+B para colapsar
  useEffect(() => {
    const handler = (e) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    // Notificar o MainLayout sobre a mudança
    if (onCollapseChange) {
      onCollapseChange(newCollapsedState);
    }
  };

  // Persistência simples do estado colapsado no desktop
  useEffect(() => {
    if (!isMobile) {
      const stored = localStorage.getItem('lumify.sidebar.collapsed');
      if (stored !== null) {
        setIsCollapsed(stored === '1');
      }
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      try {
        localStorage.setItem('lumify.sidebar.collapsed', isCollapsed ? '1' : '0');
      } catch {}
    }
  }, [isCollapsed, isMobile]);

  const currentUser = user || authUser;

  // Conteúdo do sidebar (reutilizado para desktop e mobile)
  const SidebarContent = () => (
    <TooltipProvider>
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-primary-foreground" />
          </div>
          {(!isCollapsed || isMobile) && (
            <span className="text-base font-semibold text-foreground">Lumify</span>
          )}
        </Link>
        
          {/* Botões header à direita */}
          <div className="flex items-center gap-1">
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
          </div>
      </div>
      
      {/* Botão de colapsar no desktop - posicionado absolutamente */}
      {!isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="absolute -right-1 top-8 h-6 w-6 p-0 bg-card hover:bg-secondary border rounded-full z-10 shadow-sm"
          aria-pressed={isCollapsed}
          aria-label={isCollapsed ? 'Expandir menu' : 'Colapsar menu'}
        >
          <ChevronLeft className={cn(
            "h-3 w-3 transition-transform",
            isCollapsed && "rotate-180"
          )} />
        </Button>
      )}

        {/* Navegação principal */}
      <nav className="flex-1 px-1 py-2 space-y-0.5" role="menu" aria-label="Seções">
          {(!isCollapsed || isMobile) && (
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Menu</div>
          )}
          {navItems.map((item) => (
            <NavEntry
              key={item.to}
              item={item}
              isCollapsed={isCollapsed && !isMobile}
              isMobile={isMobile}
              isActivePath={location.pathname}
              onNavigate={isMobile ? onClose : undefined}
            />
        ))}
      </nav>

      {/* User Menu */}
      <div className="px-1.5 py-1 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start px-6 py-2.5",
                isCollapsed && !isMobile && "justify-center px-2"
              )}
            >
              <User className="h-4 w-4" />
              {(!isCollapsed || isMobile) && (
                <span className="ml-2 truncate text-sm">
                  {currentUser?.user_metadata?.nome || currentUser?.email || 'Usuário'}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/configuracoes" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    </TooltipProvider>
  );

  // Entrada de navegação com suporte a tooltip no modo rail
  const NavEntry = ({ item, isCollapsed, isMobile, onNavigate }) => {
    const content = (
      <NavLink
        to={item.to}
        onClick={() => onNavigate && onNavigate()}
        role="menuitem"
        aria-label={item.label}
        className={({ isActive }) =>
          cn(
            "group flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )
        }
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {(!isCollapsed || isMobile) && (
          <span className="truncate flex-1">{item.label}</span>
        )}
      </NavLink>
    );

    if (isCollapsed && !isMobile) {
      return (
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <item.icon className="h-3.5 w-3.5" />
            <span className="text-sm">{item.label}</span>
          </TooltipContent>
        </Tooltip>
      );
    }
    return content;
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full bg-card border-r transition-all duration-300 ease-in-out hidden md:flex",
        isCollapsed ? "w-16" : "w-48"
      )}
      role="navigation"
      aria-label="Navegação principal">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile (Drawer) */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <>
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-48 bg-card border-r z-50 md:hidden"
              role="dialog" aria-modal="true" aria-label="Menu"
            >
              <SidebarContent />
            </motion.aside>
            
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={onClose}
            />
          </>
        )}
      </AnimatePresence>

      {/* Top Bar Mobile */}
      {isMobile && (
        <header className="md:hidden sticky top-0 bg-card/80 backdrop-blur-lg border-b z-30 p-2 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onOpen}
            className="h-8 w-8 p-0"
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Lumify</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Abrir opções da conta">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/configuracoes" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
      )}
    </>
  );
}
