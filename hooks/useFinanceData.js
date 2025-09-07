
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useFinanceData = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [investments, setInvestments] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [investmentGoal, setInvestmentGoal] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        
        try {
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categorias')
                .select('*')
                .or(`usuario_id.eq.${user.id},usuario_id.is.null`)
                .order('created_at', { ascending: true });
            if (categoriesError) throw categoriesError;
            setCategories(categoriesData || []);

            const { data: expensesData, error: expensesError } = await supabase.from('gastos').select('*');
            if (expensesError) throw expensesError;
            setExpenses(expensesData || []);

            const { data: investmentsData, error: investmentsError } = await supabase.from('investimentos').select('id, usuario_id, valor_aporte, saldo_total, data, created_at, categoria_id, descricao');
            if (investmentsError) throw investmentsError;
            setInvestments(investmentsData || []);

            const { data: accountsData, error: accountsError } = await supabase.from('contas_bancarias').select('*');
            if (accountsError) throw accountsError;
            setAccounts(accountsData || []);
            
            const { data: goalData, error: goalError } = await supabase.from('metas_investimento').select('meta_mensal').maybeSingle();
            if (goalError) throw goalError;
            if (goalData) setInvestmentGoal(goalData.meta_mensal);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSetInvestmentGoal = async (goal) => {
        if (!user) return;
        const { error } = await supabase.from('metas_investimento').upsert({ usuario_id: user.id, meta_mensal: goal }, { onConflict: 'usuario_id' });
        if (error) {
            console.error("Error setting investment goal:", error);
        } else {
            setInvestmentGoal(goal);
        }
    }

    const addExpense = async (expense) => {
        if (!user) return;
        const newExpense = { ...expense, usuario_id: user.id };
        const { data, error } = await supabase.from('gastos').insert(newExpense).select();
        if (error) throw error;
        setExpenses(prev => [...prev, data[0]].sort((a,b) => new Date(b.data) - new Date(a.data)));
        return data[0];
    };

    const updateExpense = async (id, updatedFields) => {
        const { data, error } = await supabase.from('gastos').update(updatedFields).eq('id', id).select();
        if (error) throw error;
        setExpenses(prev => prev.map(e => e.id === id ? data[0] : e).sort((a,b) => new Date(b.data) - new Date(a.data)));
        return data[0];
    };

    const deleteExpense = async (id) => {
        const { error } = await supabase.from('gastos').delete().eq('id', id);
        if (error) throw error;
        setExpenses(prev => prev.filter(e => e.id !== id));
    };
    
    const addInvestment = async (investment) => {
        if (!user) return;
        const newInvestment = { ...investment, usuario_id: user.id };
        const { data, error } = await supabase.from('investimentos').insert(newInvestment).select();
        if (error) throw error;
        setInvestments(prev => [...prev, data[0]].sort((a,b) => new Date(b.data) - new Date(a.data)));
        return data[0];
    };

    const updateInvestment = async (id, updatedFields) => {
        const { data, error } = await supabase.from('investimentos').update(updatedFields).eq('id', id).select();
        if (error) throw error;
        setInvestments(prev => prev.map(i => i.id === id ? data[0] : i).sort((a,b) => new Date(b.data) - new Date(a.data)));
        return data[0];
    };

    const deleteInvestment = async (id) => {
        const { error } = await supabase.from('investimentos').delete().eq('id', id);
        if (error) throw error;
        setInvestments(prev => prev.filter(i => i.id !== id));
    };
    
    const addAccount = async (account) => {
        if (!user) return;
        const newAccount = { ...account, usuario_id: user.id };
        const { data, error } = await supabase.from('contas_bancarias').insert(newAccount).select();
        if (error) throw error;
        setAccounts(prev => [...prev, data[0]]);
        return data[0];
    };

    const updateAccount = async (id, updatedFields) => {
        const { data, error } = await supabase.from('contas_bancarias').update(updatedFields).eq('id', id).select();
        if (error) throw error;
        setAccounts(prev => prev.map(a => a.id === id ? data[0] : a));
        return data[0];
    };

    const deleteAccount = async (id) => {
        const { error } = await supabase.from('contas_bancarias').delete().eq('id', id);
        if (error) throw error;
        setAccounts(prev => prev.filter(a => a.id !== id));
    };
    
    const addCategory = async (category) => {
        if (!user) return;
        const newCategory = { ...category, usuario_id: user.id };
        const { data, error } = await supabase.from('categorias').insert(newCategory).select();
        if (error) throw error;
        setCategories(prev => [...prev, data[0]]);
        return data[0];
    };
    
    const updateCategory = async (id, updatedFields) => {
        const { data, error } = await supabase.from('categorias').update(updatedFields).eq('id', id).select();
        if (error) throw error;
        setCategories(prev => prev.map(c => c.id === id ? data[0] : c));
        return data[0];
    };

    const deleteCategory = async (id) => {
        const { error } = await supabase.from('categorias').delete().eq('id', id);
        if (error) throw error;
        setCategories(prev => prev.filter(c => c.id !== id));
        fetchData();
    };

    return {
        expenses,
        investments,
        accounts,
        categories,
        investmentGoal,
        setInvestmentGoal: handleSetInvestmentGoal,
        loading,
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
        fetchData,
    };
}
