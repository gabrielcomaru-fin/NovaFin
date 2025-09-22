import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { HomeSummaryPage } from '@/pages/HomeSummaryPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { InvestmentsPage } from '@/pages/InvestmentsPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PlansPage } from '@/pages/PlansPage';
import { CalculatorPage } from '@/pages/CalculatorPage';
import { InvestmentProjectionPage } from '@/pages/InvestmentProjectionPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { GamificationPage } from '@/pages/GamificationPage';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { FinanceDataProvider } from '@/contexts/FinanceDataContext';
import { ThemeProvider } from '@/hooks/useTheme';
import { GamificationProvider } from '@/contexts/GamificationContext';

function AppContent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Lumify - Seu Controle Financeiro Pessoal</title>
        <meta name="description" content="Lumify: controle de despesas, investimentos e metas com dashboards claros e projeções inteligentes." />
        <meta property="og:title" content="Lumify - Seu Controle Financeiro Pessoal" />
        <meta property="og:description" content="Controle suas finanças com o Lumify: orçamento, investimentos e relatórios em um só lugar." />
      </Helmet>
      
      <Router>
        <FinanceDataProvider>
          <GamificationProvider>
          <Routes>
            <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            <Route element={<MainLayout user={user} onLogout={signOut} />}>
              <Route path="/dashboard" element={user ? <HomeSummaryPage /> : <Navigate to="/login" />} />
              <Route path="/resumo" element={user ? <HomeSummaryPage /> : <Navigate to="/login" />} />
              <Route path="/gastos" element={user ? <ExpensesPage /> : <Navigate to="/login" />} />
              <Route path="/investimentos" element={user ? <InvestmentsPage /> : <Navigate to="/login" />} />
              <Route path="/projecao-investimentos" element={user ? <InvestmentProjectionPage /> : <Navigate to="/login" />} />
              <Route path="/contas" element={user ? <AccountsPage /> : <Navigate to="/login" />} />
              <Route path="/calculadora" element={user ? <CalculatorPage /> : <Navigate to="/login" />} />
              <Route path="/relatorios" element={user ? <ReportsPage /> : <Navigate to="/login" />} />
              <Route path="/conquistas" element={user ? <GamificationPage /> : <Navigate to="/login" />} />
              <Route path="/gamificacao" element={<Navigate to="/conquistas" replace />} />
              <Route path="/configuracoes" element={user ? <SettingsPage /> : <Navigate to="/login" />} />
              <Route path="/planos" element={user ? <PlansPage /> : <Navigate to="/login" />} />
            </Route>
            
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
          </Routes>
          </GamificationProvider>
        </FinanceDataProvider>
      </Router>
      
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}