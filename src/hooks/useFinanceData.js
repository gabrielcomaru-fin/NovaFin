import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseCache } from '@/lib/cache';

export const useFinanceData = () => {
    const { user } = useAuth();
    const { getCachedData, invalidateCache } = useSupabaseCache();
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
            // Buscar categorias com cache
            const categoriesKey = `categories:${user.id}`;
            const categoriesData = await getCachedData(
                categoriesKey,
                async () => {
                    const { data, error } = await supabase
                        .from('categorias')
                        .select('*')
                        .or(`usuario_id.eq.${user.id},usuario_id.is.null`)
                        .order('created_at', { ascending: true });
                    if (error) throw error;
                    return data || [];
                },
                10 * 60 * 1000 // 10 minutos
            );
            setCategories(categoriesData);

            // Buscar gastos com cache
            const expensesKey = `expenses:${user.id}`;
            const expensesData = await getCachedData(
                expensesKey,
                async () => {
                    const { data, error } = await supabase
                        .from('gastos')
                        .select('*')
                        .eq('usuario_id', user.id)
                        .order('data', { ascending: false });
                    if (error) throw error;
                    return data || [];
                },
                5 * 60 * 1000 // 5 minutos
            );
            setExpenses(expensesData);

            // Buscar investimentos com cache
            const investmentsKey = `investments:${user.id}`;
            const investmentsData = await getCachedData(
                investmentsKey,
                async () => {
                    const { data, error } = await supabase
                        .from('investimentos')
                        .select('id, usuario_id, valor_aporte, saldo_total, data, created_at, categoria_id, instituicao_id, descricao')
                        .eq('usuario_id', user.id);
                    if (error) throw error;
                    return data || [];
                },
                5 * 60 * 1000 // 5 minutos
            );
            setInvestments(investmentsData);

            // Buscar contas com cache
            const accountsKey = `accounts:${user.id}`;
            const accountsData = await getCachedData(
                accountsKey,
                async () => {
                    const { data, error } = await supabase
                        .from('contas_bancarias')
                        .select('*')
                        .eq('usuario_id', user.id);
                    if (error) throw error;
                    return data || [];
                },
                10 * 60 * 1000 // 10 minutos
            );
            setAccounts(accountsData);
            
            // Buscar meta de investimento com cache
            const goalKey = `investment_goal:${user.id}`;
            const goalData = await getCachedData(
                goalKey,
                async () => {
                    const { data, error } = await supabase
                        .from('metas_investimento')
                        .select('meta_mensal')
                        .eq('usuario_id', user.id)
                        .maybeSingle();
                    if (error) throw error;
                    return data?.meta_mensal || 0;
                },
                10 * 60 * 1000 // 10 minutos
            );
            setInvestmentGoal(goalData);

        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, getCachedData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Funções CRUD simplificadas
    const addExpense = useCallback(async (expenseData) => {
        if (!user) return;
        
        const { data, error } = await supabase
            .from('gastos')
            .insert([{ ...expenseData, usuario_id: user.id }])
            .select()
            .single();
        
        if (error) throw error;
        setExpenses(prev => [data, ...prev]);
        invalidateCache(`expenses:${user.id}`);
        return data;
    }, [user, invalidateCache]);

    const updateExpense = useCallback(async (id, updates) => {
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
        invalidateCache(`expenses:${user.id}`);
        return data;
    }, [user, invalidateCache]);

    const deleteExpense = useCallback(async (id) => {
        const { error } = await supabase
            .from('gastos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        setExpenses(prev => prev.filter(expense => expense.id !== id));
        invalidateCache(`expenses:${user.id}`);
    }, [user, invalidateCache]);

    const addInvestment = useCallback(async (investmentData) => {
        if (!user) return;
        
        const { data, error } = await supabase
            .from('investimentos')
            .insert([{ ...investmentData, usuario_id: user.id }])
            .select()
            .single();
        
        if (error) throw error;
        setInvestments(prev => [data, ...prev]);
        invalidateCache(`investments:${user.id}`);
        return data;
    }, [user, invalidateCache]);

    const updateInvestment = useCallback(async (id, updates) => {
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
        invalidateCache(`investments:${user.id}`);
        return data;
    }, [user, invalidateCache]);

    const deleteInvestment = useCallback(async (id) => {
        const { error } = await supabase
            .from('investimentos')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        setInvestments(prev => prev.filter(investment => investment.id !== id));
        invalidateCache(`investments:${user.id}`);
    }, [user, invalidateCache]);

    const addAccount = useCallback(async (accountData) => {
        if (!user) return;
        
        const { data, error } = await supabase
            .from('contas_bancarias')
            .insert([{ ...accountData, usuario_id: user.id }])
            .select()
            .single();
        
        if (error) throw error;
        setAccounts(prev => [data, ...prev]);
        invalidateCache(`accounts:${user.id}`);
        return data;
    }, [user, invalidateCache]);

    const updateAccount = useCallback(async (id, updates) => {
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
        invalidateCache(`accounts:${user.id}`);
        return data;
    }, [user, invalidateCache]);

    const deleteAccount = useCallback(async (id) => {
        const { error } = await supabase
            .from('contas_bancarias')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        setAccounts(prev => prev.filter(account => account.id !== id));
        invalidateCache(`accounts:${user.id}`);
    }, [user, invalidateCache]);

    const addCategory = useCallback(async (categoryData) => {
        if (!user) return;
        
        const { data, error } = await supabase
            .from('categorias')
            .insert([{ ...categoryData, usuario_id: user.id }])
            .select()
            .single();
        
        if (error) throw error;
        setCategories(prev => [data, ...prev]);
        invalidateCache(`categories:${user.id}`);
        return data;
    }, [user, invalidateCache]);

    const updateCategory = useCallback(async (id, updates) => {
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
        invalidateCache(`categories:${user.id}`);
        return data;
    }, [user, invalidateCache]);

    const deleteCategory = useCallback(async (id) => {
        const { error } = await supabase
            .from('categorias')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        setCategories(prev => prev.filter(category => category.id !== id));
        invalidateCache(`categories:${user.id}`);
    }, [user, invalidateCache]);

    const handleSetInvestmentGoal = useCallback(async (goal) => {
        if (!user) return;
        
        const { data, error } = await supabase
            .from('metas_investimento')
            .upsert([{ usuario_id: user.id, meta_mensal: goal }])
            .select()
            .single();
        
        if (error) throw error;
        setInvestmentGoal(goal);
        invalidateCache(`investment_goal:${user.id}`);
        return data;
    }, [user, invalidateCache]);

    // Calcular patrimônio total
    const totalPatrimony = investments.reduce((total, investment) => {
        return total + (investment.saldo_total || 0);
    }, 0);

    return {
        expenses,
        investments,
        accounts,
        categories,
        investmentGoal,
        totalPatrimony,
        isLoading,
        fetchData,
        addExpense,
        updateExpense,
        deleteExpense,
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