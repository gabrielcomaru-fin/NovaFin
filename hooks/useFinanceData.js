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
            const { data: categoriesData, error: categoriesError } = await supabase.from('categorias').select('*').order('created_at', { ascending: true });
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
            
            const savedGoal = localStorage.getItem(`financeApp_investmentGoal_${user.id}`);
            if (savedGoal) setInvestmentGoal(JSON.parse(savedGoal));

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
        const { data, error } = await supabase.from('investimentos').update(updatedFields).select();
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

    const handleSetInvestmentGoal = (goal) => {
      if (!user) return;
      localStorage.setItem(`financeApp_investmentGoal_${user.id}`, JSON.stringify(goal));
      setInvestmentGoal(goal);
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.data);
        return expenseDate.getUTCMonth() === currentMonth && expenseDate.getUTCFullYear() === currentYear;
    });

    const monthlyInvestments = investments.filter(investment => {
        const investmentDate = new Date(investment.data);
        return investmentDate.getUTCMonth() === currentMonth && investmentDate.getUTCFullYear() === currentYear;
    });

    const totalMonthlyExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.valor, 0);
    const totalMonthlyInvestments = monthlyInvestments.reduce((sum, investment) => sum + investment.valor_aporte, 0);
    const totalAccountBalance = accounts.reduce((sum, account) => sum + account.saldo, 0);

    const totalInvestmentBalance = investments.reduce((sum, investment) => sum + investment.valor_aporte, 0);

    const expensesByCategory = categories
        .filter(c => c.tipo === 'gasto')
        .reduce((acc, category) => {
            acc[category.id] = monthlyExpenses
                .filter(expense => expense.categoria_id === category.id)
                .reduce((sum, expense) => sum + expense.valor, 0);
            return acc;
    }, {});


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
        addCategory,
        updateCategory,
        deleteCategory,
        totalMonthlyExpenses,
        totalMonthlyInvestments,
        totalAccountBalance,
        totalInvestmentBalance,
        expensesByCategory,
        monthlyExpenses,
        monthlyInvestments,
        fetchData,
    };
}