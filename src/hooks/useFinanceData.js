import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
// import { useSupabaseCache } from '@/lib/cache';
// import { useErrorHandler } from '@/hooks/useErrorHandler';
// import { useLoading } from '@/hooks/useLoading';

export const useFinanceData = () => {
    const { user } = useAuth();
    // const { getCachedData, invalidateCache } = useSupabaseCache();
    // const { handleError } = useErrorHandler();
    // const { isLoading, startLoading, stopLoading } = useLoading();
    const [isLoading, setIsLoading] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [investments, setInvestments] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [investmentGoal, setInvestmentGoal] = useState(0);

    const fetchData = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Buscar categorias
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categorias')
                .select('*')
                .or(`usuario_id.eq.${user.id},usuario_id.is.null`)
                .order('created_at', { ascending: true });
            if (categoriesError) throw categoriesError;
            setCategories(categoriesData || []);

            // Buscar gastos
            const { data: expensesData, error: expensesError } = await supabase
                .from('gastos')
                .select('*')
                .eq('usuario_id', user.id)
                .order('data', { ascending: false });
            if (expensesError) throw expensesError;
            setExpenses(expensesData || []);

            // Buscar investimentos
            const { data: investmentsData, error: investmentsError } = await supabase
                .from('investimentos')
                .select('*')
                .eq('usuario_id', user.id);
            if (investmentsError) throw investmentsError;
            setInvestments(investmentsData || []);

            // Buscar contas
            const { data: accountsData, error: accountsError } = await supabase
                .from('contas_bancarias')
                .select('*')
                .eq('usuario_id', user.id);
            if (accountsError) throw accountsError;
            setAccounts(accountsData || []);
            
            // Buscar meta de investimento com fallback localStorage
            try {
                const { data: goalData, error: goalError } = await supabase
                    .from('metas_investimento')
                    .select('meta_mensal')
                    .eq('usuario_id', user.id)
                    .maybeSingle();
                if (goalError) throw goalError;
                const goalValue = goalData?.meta_mensal ?? 0;
                setInvestmentGoal(goalValue);
                try { localStorage.setItem('novaFin_investment_goal_v1', String(goalValue)); } catch {}
            } catch (err) {
                try {
                    const localGoal = Number(localStorage.getItem('novaFin_investment_goal_v1')) || 0;
                    setInvestmentGoal(localGoal);
                } catch {
                    setInvestmentGoal(0);
                }
            }

        } catch (error) {
            console.error('Erro ao buscar dados financeiros:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Funções CRUD simplificadas
    const addExpense = useCallback(async (expenseData) => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('gastos')
                .insert([{ ...expenseData, usuario_id: user.id }])
                .select()
                .single();
            
            if (error) throw error;
            setExpenses(prev => [data, ...prev]);
            return data;
        } catch (error) {
            console.error('Erro ao adicionar despesa:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const updateExpense = useCallback(async (id, updates) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('gastos')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            setExpenses(prev => prev.map(expense => 
                expense.id === id ? data : expense
            ));
            return data;
        } catch (error) {
            console.error('Erro ao atualizar despesa:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const deleteExpense = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('gastos')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setExpenses(prev => prev.filter(expense => expense.id !== id));
        } catch (error) {
            console.error('Erro ao excluir despesa:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const addInvestment = useCallback(async (investmentData) => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('investimentos')
                .insert([{ ...investmentData, usuario_id: user.id }])
                .select()
                .single();
            
            if (error) throw error;
            setInvestments(prev => [data, ...prev]);
            return data;
        } catch (error) {
            console.error('Erro ao adicionar investimento:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const updateInvestment = useCallback(async (id, updates) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('investimentos')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            setInvestments(prev => prev.map(investment => 
                investment.id === id ? data : investment
            ));
            return data;
        } catch (error) {
            console.error('Erro ao atualizar investimento:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const deleteInvestment = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('investimentos')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setInvestments(prev => prev.filter(investment => investment.id !== id));
        } catch (error) {
            console.error('Erro ao excluir investimento:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const addAccount = useCallback(async (accountData) => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('contas_bancarias')
                .insert([{ ...accountData, usuario_id: user.id }])
                .select()
                .single();
            
            if (error) throw error;
            setAccounts(prev => [data, ...prev]);
            return data;
        } catch (error) {
            console.error('Erro ao adicionar conta:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const updateAccount = useCallback(async (id, updates) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('contas_bancarias')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            setAccounts(prev => prev.map(account => 
                account.id === id ? data : account
            ));
            return data;
        } catch (error) {
            console.error('Erro ao atualizar conta:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const deleteAccount = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('contas_bancarias')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setAccounts(prev => prev.filter(account => account.id !== id));
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const addCategory = useCallback(async (categoryData) => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('categorias')
                .insert([{ ...categoryData, usuario_id: user.id }])
                .select()
                .single();
            
            if (error) throw error;
            setCategories(prev => [data, ...prev]);
            return data;
        } catch (error) {
            console.error('Erro ao adicionar categoria:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const updateCategory = useCallback(async (id, updates) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('categorias')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            setCategories(prev => prev.map(category => 
                category.id === id ? data : category
            ));
            return data;
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const deleteCategory = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('categorias')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setCategories(prev => prev.filter(category => category.id !== id));
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const handleSetInvestmentGoal = useCallback(async (goal) => {
        if (!user) {
            // Permitir uso offline: salvar localmente
            try { localStorage.setItem('novaFin_investment_goal_v1', String(goal)); } catch {}
            setInvestmentGoal(goal);
            return { persisted: 'local' };
        }
        setIsLoading(true);
        try {
            // Primeiro tenta atualizar registro existente por usuario_id
            let data = null;
            let error = null;
            const updateRes = await supabase
                .from('metas_investimento')
                .update({ meta_mensal: goal })
                .eq('usuario_id', user.id)
                .select('usuario_id, meta_mensal')
                .maybeSingle();

            if (!updateRes.error && updateRes.data) {
                data = updateRes.data;
            } else {
                // Se não existir, insere (sem depender de unique constraint)
                const insertRes = await supabase
                    .from('metas_investimento')
                    .insert([{ usuario_id: user.id, meta_mensal: goal }])
                    .select('usuario_id, meta_mensal')
                    .single();
                if (insertRes.error) {
                    error = insertRes.error;
                } else {
                    data = insertRes.data;
                }
            }

            if (error) throw error;
            setInvestmentGoal(goal);
            try { localStorage.setItem('novaFin_investment_goal_v1', String(goal)); } catch {}
            return { persisted: 'db', data };
        } catch (error) {
            console.warn('Falha ao salvar meta no Supabase, usando fallback local:', error);
            setInvestmentGoal(goal);
            try { localStorage.setItem('novaFin_investment_goal_v1', String(goal)); } catch {}
            return { persisted: 'local' };
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const toggleExpensePayment = useCallback(async (id) => {
        setIsLoading(true);
        try {
            // Primeiro, buscar a despesa atual para obter o status atual
            const { data: currentExpense, error: fetchError } = await supabase
                .from('gastos')
                .select('pago')
                .eq('id', id)
                .single();
            
            if (fetchError) throw fetchError;
            
            // Alternar o status de pagamento
            const newPaymentStatus = !currentExpense.pago;
            
            const { data, error } = await supabase
                .from('gastos')
                .update({ pago: newPaymentStatus })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            setExpenses(prev => prev.map(expense => 
                expense.id === id ? data : expense
            ));
            return data;
        } catch (error) {
            console.error('Erro ao alternar status de pagamento:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Calcular patrimônio total (investimentos + saldos das contas bancárias)
    const totalInvestmentBalance = investments.reduce((total, investment) => {
        // Tentar diferentes campos possíveis para o saldo
        const saldo = investment.saldo_total || 
                     investment.valor_atual || 
                     investment.valor || 
                     investment.saldo || 
                     investment.valor_aporte || 
                     investment.amount || 
                     investment.balance || 
                     0;
        
        return total + saldo;
    }, 0);

    const totalAccountBalance = accounts.reduce((total, account) => {
        return total + (account.saldo || 0);
    }, 0);

    const totalPatrimony = totalInvestmentBalance + totalAccountBalance;
    

    return {
        expenses,
        investments,
        accounts,
        categories,
        investmentGoal,
        totalPatrimony,
        totalInvestmentBalance,
        totalAccountBalance,
        isLoading,
        fetchData,
        addExpense,
        updateExpense,
        deleteExpense,
        toggleExpensePayment,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        handleSetInvestmentGoal
    };
};