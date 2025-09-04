import React from 'react';
import { Helmet } from 'react-helmet';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
  return (
    <>
      <Helmet>
        <title>Login - FinanceApp</title>
      </Helmet>
      <AuthForm onLogin={signIn} />
    </>
  );
}