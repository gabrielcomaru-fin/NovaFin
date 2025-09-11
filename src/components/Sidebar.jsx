import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  LayoutDashboard, 
  Receipt, 
  TrendingUp, 
  Landmark, 
  LogOut, 
  DollarSign,
  User,
  Settings,
  Star,
  Calculator,
  ChevronLeft,
  Menu,
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const navItems = [
  { to: '/dashboard', label: 'Resumo Geral', icon: LayoutDashboard },
  { to: '/gastos', label: 'Despesas', icon: Receipt },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/projecao-investimentos', label: 'Projeção', icon: LineChart },
  { to: '/contas', label: 'Contas', icon: Landmark },
  { to: '/calculadora', label: 'Calculadora', icon: Calculator },
  { to: '/planos', label: 'Planos', icon: Star },
];

export function Sidebar({ onLogout }) {
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const SidebarContent = () => (
      <>
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/dashboard" className={cn("flex items-center gap-2 overflow-hidden", isCollapsed && "w-0")}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text-blue whitespace-nowrap">FinanceApp</span>
          </Link>
          <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={() => setIsCollapsed(!isCollapsed)}>
            <ChevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        <nav className="flex-grow px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Button asChild key={item.to} variant="ghost" className={cn("w-full justify-start", isCollapsed && "justify-center")}>
              <NavLink to={item.to} className={({ isActive }) => cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50",
                  isCollapsed && "p-2 h-10 w-10"
              )}>
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className={cn("truncate", isCollapsed && "lg:hidden")}>{item.label}</span>
              </NavLink>
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button variant="ghost" className={cn("w-full justify-start", isCollapsed && "justify-center")}>
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                     </div>
                    <div className={cn("flex flex-col items-start overflow-hidden", isCollapsed && "lg:hidden")}>
                        <p className="text-sm font-medium leading-none truncate">{user?.user_metadata?.nome || user?.email}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="start" side="top" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.user_metadata?.nome || user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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
        </div>
      </>
    );

    return (
        <>
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 flex-col bg-card border-r hidden lg:flex transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}>
                <SidebarContent />
            </aside>

            <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between w-full h-16 px-4 border-b bg-card">
                 <Link to="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold gradient-text-blue">FinanceApp</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <Menu className="h-6 w-6" />
                </Button>
            </header>
            
            <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="lg:hidden fixed inset-0 z-50 bg-card/95 backdrop-blur-sm"
                >
                    <div className="flex flex-col h-full">
                       <SidebarContent />
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </>
    );
}