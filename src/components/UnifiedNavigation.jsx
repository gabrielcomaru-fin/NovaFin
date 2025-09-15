import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Configuração unificada dos itens de navegação
const navItems = [
  { to: '/dashboard', label: 'Resumo Geral', icon: LayoutDashboard },
  { to: '/gastos', label: 'Despesas', icon: Receipt },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/projecao-investimentos', label: 'Projeção', icon: Target },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/contas', label: 'Contas', icon: Wallet },
  { to: '/calculadora', label: 'Calculadora', icon: Calculator },
  { to: '/planos', label: 'Planos', icon: Star },
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteRoutes, setFavoriteRoutes] = useState(() => {
    try {
      const raw = localStorage.getItem('sidebar:favorites');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  
  
  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile && isOpen) {
      onClose();
    }
  }, [isMobile, isOpen, onClose, location.pathname]);

  // Persist favoritos e recentes
  useEffect(() => {
    try { localStorage.setItem('sidebar:favorites', JSON.stringify(favoriteRoutes)); } catch {}
  }, [favoriteRoutes]);
  

  // Atalhos de teclado: Ctrl/Cmd+K para busca, Ctrl/Cmd+B para colapsar
  useEffect(() => {
    const handler = (e) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen((v) => !v);
      }
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

  const currentUser = user || authUser;

  const toggleFavorite = useCallback((route) => {
    setFavoriteRoutes((prev) => {
      const exists = prev.includes(route);
      return exists ? prev.filter((r) => r !== route) : [...prev, route];
    });
  }, []);

  

  const itemsByRoute = useMemo(() => {
    const map = new Map();
    navItems.forEach((i) => map.set(i.to, i));
    return map;
  }, []);

  const favoriteItems = useMemo(() => favoriteRoutes
    .map((r) => itemsByRoute.get(r))
    .filter(Boolean), [favoriteRoutes, itemsByRoute]);

  

  const filteredItems = useMemo(() => {
    if (!searchQuery) return navItems;
    const q = searchQuery.toLowerCase();
    return navItems.filter((i) => i.label.toLowerCase().includes(q) || i.to.toLowerCase().includes(q));
  }, [searchQuery]);

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
            <span className="text-base font-semibold text-foreground">FinanceApp</span>
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
        >
          <ChevronLeft className={cn(
            "h-3 w-3 transition-transform",
            isCollapsed && "rotate-180"
          )} />
        </Button>
      )}

        {/* Campo de busca inline quando expandido (desktop) */}
        {!isMobile && !isCollapsed && (
          <div className="px-2 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar... (Ctrl/⌘K)"
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>
        )}

        {/* Navegação com grupos inteligentes */}
      <nav className="flex-1 px-1.5 py-1 space-y-1">
          {/* Favoritos */}
          {favoriteItems.length > 0 && (!isCollapsed || isMobile) && (
            <div className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Favoritos</div>
          )}
          {favoriteItems.map((item) => (
            <NavEntry
              key={`fav-${item.to}`}
              item={item}
              isCollapsed={isCollapsed && !isMobile}
              isMobile={isMobile}
              isActivePath={location.pathname}
              onFavorToggle={toggleFavorite}
              isFavorite={favoriteRoutes.includes(item.to)}
            />
          ))}

          {/* Recentes */}
          

          {/* Todos */}
          {(!isCollapsed || isMobile) && (
            <div className="px-3 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Navegação</div>
          )}
          {(searchQuery ? filteredItems : navItems).map((item) => (
            <NavEntry
            key={item.to}
              item={item}
              isCollapsed={isCollapsed && !isMobile}
              isMobile={isMobile}
              isActivePath={location.pathname}
              onFavorToggle={toggleFavorite}
              isFavorite={favoriteRoutes.includes(item.to)}
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
  const NavEntry = ({ item, isCollapsed, isMobile, isActivePath, onFavorToggle, isFavorite, onNavigate }) => {
    const content = (
      <NavLink
        to={item.to}
        onClick={() => onNavigate && onNavigate()}
        className={({ isActive }) =>
          cn(
            "group flex items-center space-x-3 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
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
        {(!isCollapsed || isMobile) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorToggle(item.to); }}
            className={cn(
              "h-6 w-6 p-0 opacity-60 hover:opacity-100",
              isFavorite ? "text-yellow-500" : "text-muted-foreground"
            )}
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-yellow-500")}/>
          </Button>
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
        isCollapsed ? "w-16" : "w-64"
      )}>
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
              className="fixed top-0 left-0 h-full w-64 bg-card border-r z-50 md:hidden"
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
            onClick={onOpen} // Abre o sidebar
            className="h-8 w-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">FinanceApp</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
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

      {/* Command Palette / Busca Global */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>Buscar</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar páginas..."
                className="pl-10 h-10"
              />
            </div>
            <div className="mt-3 max-h-72 overflow-auto">
              {(filteredItems.length === 0) && (
                <div className="text-sm text-muted-foreground px-2 py-3">Nenhum resultado.</div>
              )}
              {filteredItems.map((item) => (
                <Link
                  key={`search-${item.to}`}
                  to={item.to}
                  onClick={() => { setIsSearchOpen(false); registerRecent(item.to); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                  {favoriteRoutes.includes(item.to) && (
                    <Star className="ml-auto h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
