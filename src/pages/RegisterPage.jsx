import React from 'react';
import { Helmet } from 'react-helmet';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export function RegisterPage() {
  const { signUp } = useAuth();
  return (
    <>
      <Helmet>
        <title>Criar Conta - FinanceApp</title>
      </Helmet>
      <AuthForm onRegister={signUp} />
    </>
  );
}