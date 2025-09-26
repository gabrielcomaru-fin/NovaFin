import React, { useState } from 'react';
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
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  LogOut,
  User,
  Settings,
  Menu,
  X,
  BarChart3,
  Wallet,
  Target,
  Calculator,
  Trophy,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Navegação simplificada com apenas 4 itens principais
const simplifiedNavItems = [
  { 
    to: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Visão geral e insights'
  },
  { 
    to: '/transactions', 
    label: 'Transações', 
    icon: Receipt,
    description: 'Despesas e investimentos'
  },
  { 
    to: '/analysis', 
    label: 'Análise', 
    icon: BarChart3,
    description: 'Relatórios e projeções'
  },
  { 
    to: '/settings', 
    label: 'Configurações', 
    icon: Settings,
    description: 'Contas e preferências'
  }
];

// Submenu para cada item principal
const submenuItems = {
  dashboard: [
    { to: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { to: '/dashboard/insights', label: 'Insights', icon: Target },
    { to: '/dashboard/quick-actions', label: 'Ações Rápidas', icon: Calculator }
  ],
  transactions: [
    { to: '/transactions', label: 'Todas as Transações', icon: Receipt },
    { to: '/transactions/expenses', label: 'Despesas', icon: Receipt },
    { to: '/transactions/investments', label: 'Investimentos', icon: TrendingUp },
    { to: '/transactions/pending', label: 'Pendentes', icon: Target }
  ],
  analysis: [
    { to: '/analysis/reports', label: 'Relatórios', icon: BarChart3 },
    { to: '/analysis/projections', label: 'Projeções', icon: Target },
    { to: '/analysis/benchmarks', label: 'Benchmarks', icon: TrendingUp },
    { to: '/analysis/scenarios', label: 'Cenários', icon: Calculator }
  ],
  settings: [
    { to: '/settings/accounts', label: 'Contas', icon: Wallet },
    { to: '/settings/categories', label: 'Categorias', icon: Receipt },
    { to: '/settings/goals', label: 'Metas', icon: Target },
    { to: '/settings/gamification', label: 'Conquistas', icon: Trophy },
    { to: '/settings/preferences', label: 'Preferências', icon: Settings }
  ]
};

export function SimplifiedNavigation({ user, onLogout, isMobile, isOpen, onClose, onOpen }) {
  const location = useLocation();
  const [expandedItem, setExpandedItem] = useState(null);

  const currentUser = user;

  const toggleExpanded = (item) => {
    setExpandedItem(expandedItem === item ? null : item);
  };

  const getCurrentMainItem = () => {
    const currentPath = location.pathname;
    if (currentPath.startsWith('/dashboard')) return 'dashboard';
    if (currentPath.startsWith('/transactions')) return 'transactions';
    if (currentPath.startsWith('/analysis')) return 'analysis';
    if (currentPath.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Lumify</span>
        </Link>
        
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Navegação Principal */}
      <nav className="flex-1 p-4 space-y-2">
        {simplifiedNavItems.map((item) => {
          const isActive = getCurrentMainItem() === item.to.split('/')[1];
          const isExpanded = expandedItem === item.to;
          const submenu = submenuItems[item.to.split('/')[1]] || [];

          return (
            <div key={item.to}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-auto p-3",
                  isActive && "bg-primary text-primary-foreground"
                )}
                onClick={() => {
                  if (submenu.length > 0) {
                    toggleExpanded(item.to);
                  }
                }}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </Button>

              {/* Submenu */}
              <AnimatePresence>
                {isExpanded && submenu.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 mt-2 space-y-1"
                  >
                    {submenu.map((subItem) => (
                      <NavLink
                        key={subItem.to}
                        to={subItem.to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )
                        }
                      >
                        <subItem.icon className="h-4 w-4" />
                        {subItem.label}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              <span className="truncate">
                {currentUser?.user_metadata?.nome || currentUser?.email || 'Usuário'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings/preferences" className="flex items-center">
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
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full bg-card border-r transition-all duration-300 ease-in-out hidden md:flex",
        "w-64"
      )}>
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <>
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-64 bg-card border-r z-50 md:hidden"
            >
              <SidebarContent />
            </motion.aside>
            
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
        <header className="md:hidden sticky top-0 bg-card/80 backdrop-blur-lg border-b z-30 p-4 flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={onOpen} className="h-8 w-8 p-0">
            <Menu className="h-4 w-4" />
          </Button>
          
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Lumify</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings/preferences" className="flex items-center">
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
