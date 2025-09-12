import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const navItems = [
  { to: '/dashboard', label: 'Resumo Geral', icon: LayoutDashboard },
  { to: '/gastos', label: 'Despesas', icon: Receipt },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/projecao-investimentos', label: 'Projeção', icon: LineChart },
  { to: '/relatorios', label: 'Relatórios', icon: LineChart },
  { to: '/contas', label: 'Contas', icon: Landmark },
  { to: '/calculadora', label: 'Calculadora', icon: Calculator },
  { to: '/planos', label: 'Planos', icon: Star },
];

export function Sidebar({ onLogout }) {
    const { user } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={cn(
            "fixed left-0 top-0 z-50 h-full bg-card border-r transition-all duration-300 ease-in-out",
            isCollapsed ? "w-16" : "w-64"
        )}>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <Link to="/dashboard" className="flex items-center space-x-2">
                        <DollarSign className="h-8 w-8 text-primary" />
                        {!isCollapsed && (
                            <span className="text-xl font-bold">FinanceApp</span>
                        )}
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className={cn(
                            "h-4 w-4 transition-transform",
                            isCollapsed && "rotate-180"
                        )} />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )
                            }
                        >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User Menu */}
                <div className="p-4 border-t">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start",
                                    isCollapsed && "justify-center"
                                )}
                            >
                                <User className="h-4 w-4" />
                                {!isCollapsed && (
                                    <span className="ml-2 truncate">
                                        {user?.email || 'Usuário'}
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
        </div>
    );
}