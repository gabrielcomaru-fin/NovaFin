import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    } else {
        toast({
            title: "Cadastro realizado com sucesso!",
            description: "Enviamos um e-mail de confirmação para você.",
        });
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const resetPassword = useCallback(async (email) => {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha ao enviar e-mail",
        description: error.message || "Tente novamente mais tarde.",
      });
    } else {
      toast({
        title: "Verifique seu e-mail",
        description: "Enviamos um link para redefinir sua senha.",
      });
    }

    return { error };
  }, [toast]);

  const updatePassword = useCallback(async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({
        variant: "destructive",
        title: "Não foi possível atualizar a senha",
        description: error.message || "Tente novamente.",
      });
    } else {
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
    }

    return { data, error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  }), [user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { toast } = useToast();

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { error, user, session, ...rest } = context;

  // Display login success toast only when a session becomes available
  useEffect(() => {
    if (session && !context.loading) {
       // A simple flag to prevent showing the toast on every re-render/session refresh
      const hasShownLoginToast = sessionStorage.getItem('loginToastShown');
      if (!hasShownLoginToast) {
        toast({
          title: 'Login realizado com sucesso!',
          description: `Bem-vindo de volta, ${user?.user_metadata?.nome || user?.email}!`,
        });
        sessionStorage.setItem('loginToastShown', 'true');
      }
    }
    // On logout, remove the flag
    if (!session) {
      sessionStorage.removeItem('loginToastShown');
    }
  }, [session, user, context.loading, toast]);

  return { user, session, error, ...rest };
};