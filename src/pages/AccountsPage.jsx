import React from 'react';
import { Helmet } from 'react-helmet';
import { AccountForm } from '@/components/AccountForm';

export function AccountsPage() {
  return (
    <>
      <Helmet>
        <title>Minhas Contas - FinanceApp</title>
        <meta name="description" content="Gerencie suas contas bancárias." />
      </Helmet>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Suas Contas</h1>
        <AccountForm />
      </div>
    </>
  );
}