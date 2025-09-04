import React from 'react';
import { Helmet } from 'react-helmet';
import { Dashboard } from '@/components/Dashboard';

export function DashboardPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard - FinanceApp</title>
        <meta name="description" content="Seu controle financeiro." />
      </Helmet>
       <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h1>
        <Dashboard />
      </div>
    </>
  );
}