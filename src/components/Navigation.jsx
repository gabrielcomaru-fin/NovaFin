import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
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
  CreditCard,
  LogOut,
  DollarSign,
  User,
  Settings,
  Star,
  Calculator,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation({ user, onLogout, isSidebarOpen, setSidebarOpen }) {
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/gastos', label: 'Despesas', icon: Receipt },
    { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
    { to: '/contas', label: 'Contas', icon: CreditCard },
    { to: '/calculadora', label: 'Calculadora', icon: Calculator },
    { to: '/planos', label: 'Planos', icon: Star },
  ];
  
  const bottomNavItems = [
    { to: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`p-4 ${isSidebarOpen ? 'flex' : 'hidden md:flex'} justify-between items-center`}>
        <Link to="/dashboard" className={cn("flex items-center gap-2", !isSidebarOpen && "md:hidden")}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold gradient-text-blue whitespace-nowrap">FinanceApp</span>
        </Link>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
        </Button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center p-3 rounded-lg transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive ? 'bg-secondary text-primary font-semibold' : 'text-muted-foreground',
                !isSidebarOpen && 'justify-center'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn('ml-4 whitespace-nowrap', !isSidebarOpen && 'md:hidden')}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-4 space-y-2">
        {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                        'flex items-center p-3 rounded-lg transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                         isActive ? 'bg-secondary text-primary font-semibold' : 'text-muted-foreground',
                        !isSidebarOpen && 'justify-center'
                    )}
                >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className={cn('ml-4 whitespace-nowrap', !isSidebarOpen && 'md:hidden')}>{item.label}</span>
                </NavLink>
            );
        })}
        
        <div className={cn(
                'flex items-center p-3 rounded-lg transition-colors text-muted-foreground',
                !isSidebarOpen && 'justify-center'
            )}>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <div className="flex items-center cursor-pointer w-full">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5" />
                    </div>
                    <div className={cn("ml-3 flex-1", !isSidebarOpen && "md:hidden")}>
                        <p className="text-sm font-medium leading-none text-foreground">{user?.user_metadata?.nome || 'Usuário'}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" side="right" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.user_metadata?.nome || user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className={cn(
        'fixed top-0 left-0 h-full bg-card border-r z-40 transition-all duration-300 hidden md:flex',
        isSidebarOpen ? 'w-64' : 'w-20'
        )}>
        <SidebarContent />
         <Button 
            variant="ghost" 
            size="icon" 
            className="absolute -right-4 top-16 hidden md:inline-flex bg-card hover:bg-secondary border rounded-full h-8 w-8"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
            {isSidebarOpen ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
        </Button>
      </aside>

      {/* Sidebar for Mobile (Drawer) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-64 bg-card border-r z-50 md:hidden"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Top bar for mobile */}
      <header className="md:hidden sticky top-0 bg-card/80 backdrop-blur-lg border-b z-30 p-2 flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary-foreground" />
          </div>
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
                <DropdownMenuItem asChild>
                  <Link to="/configuracoes">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </>
  );
}