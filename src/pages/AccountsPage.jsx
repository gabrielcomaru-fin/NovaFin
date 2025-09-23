import React from 'react';
import { Helmet } from 'react-helmet';
import { AccountForm } from '@/components/AccountForm';

export function AccountsPage() {
  return (
    <>
      <Helmet>
        <title>Instituições Financeiras - Lumify</title>
        <meta name="description" content="Gerencie suas instituições financeiras e patrimônio." />
      </Helmet>
      <div className="space-y-4 page-top">
        <h1 className="text-2xl font-bold tracking-tight">Instituições Financeiras</h1>
        <AccountForm />
      </div>
    </>
  );
}