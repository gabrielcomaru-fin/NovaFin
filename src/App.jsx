import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const HomeSummaryPage = lazy(() => import('@/pages/HomeSummaryPage').then(m => ({ default: m.HomeSummaryPage })));
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const InvestmentsPage = lazy(() => import('@/pages/InvestmentsPage').then(m => ({ default: m.InvestmentsPage })));
const AccountsPage = lazy(() => import('@/pages/AccountsPage').then(m => ({ default: m.AccountsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PlansPage = lazy(() => import('@/pages/PlansPage').then(m => ({ default: m.PlansPage })));
const CalculatorPage = lazy(() => import('@/pages/CalculatorPage').then(m => ({ default: m.CalculatorPage })));
const InvestmentProjectionPage = lazy(() => import('@/pages/InvestmentProjectionPage').then(m => ({ default: m.InvestmentProjectionPage })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const GamificationPage = lazy(() => import('@/pages/GamificationPage').then(m => ({ default: m.GamificationPage })));
import { MainLayout } from '@/components/MainLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
      
      <ErrorBoundary>
        <Router>
          <FinanceDataProvider>
            <GamificationProvider>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                />
              </div>
            }>
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
            </Suspense>
            </GamificationProvider>
          </FinanceDataProvider>
        </Router>
      </ErrorBoundary>
      
      {/* Toaster é renderizado no App.jsx; manter import apenas se usado globalmente */}
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