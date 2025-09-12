
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

            const { data: investmentsData, error: investmentsError } = await supabase.from('investimentos').select('id, usuario_id, valor_aporte, saldo_total, data, created_at, categoria_id, instituicao_id, descricao');
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
        const newExpense = { ...expense, usuario_id: user.id, pago: expense.pago || false };
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

    const toggleExpensePayment = async (id) => {
        const expense = expenses.find(e => e.id === id);
        if (!expense) return;
        
        const { data, error } = await supabase
            .from('gastos')
            .update({ pago: !expense.pago })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        setExpenses(prev => prev.map(e => e.id === id ? data[0] : e).sort((a,b) => new Date(b.data) - new Date(a.data)));
        return data[0];
    };
    
    const addInvestment = async (investment) => {
        if (!user) return;
        const newInvestment = { ...investment, usuario_id: user.id };
        const { data, error } = await supabase.from('investimentos').insert(newInvestment).select();
        if (error) throw error;
        const saved = data[0];
        setInvestments(prev => [...prev, saved].sort((a,b) => new Date(b.data) - new Date(a.data)));

        // Atualiza saldo da instituição vinculada (somar aporte)
        try {
            if (saved.instituicao_id) {
                const account = accounts.find(a => a.id === saved.instituicao_id);
                if (account) {
                    const newBalance = (account.saldo || 0) + (saved.valor_aporte || 0);
                    const { data: accData, error: accErr } = await supabase
                        .from('contas_bancarias')
                        .update({ saldo: newBalance })
                        .eq('id', account.id)
                        .select();
                    if (!accErr && accData?.[0]) {
                        setAccounts(prev => prev.map(a => a.id === account.id ? accData[0] : a));
                    }
                }
            }
        } catch (e) {
            console.error('Erro ao atualizar saldo da instituição após novo aporte:', e);
        }
        return data[0];
    };

    const updateInvestment = async (id, updatedFields) => {
        // Encontrar investimento anterior para calcular diferenças de saldo
        const previous = investments.find(i => i.id === id);
        const { data, error } = await supabase.from('investimentos').update(updatedFields).eq('id', id).select();
        if (error) throw error;
        const updated = data[0];
        setInvestments(prev => prev.map(i => i.id === id ? updated : i).sort((a,b) => new Date(b.data) - new Date(a.data)));

        // Ajustar saldos das instituições considerando inclusão/remoção/troca e/ou diferença de aporte
        try {
            if (previous) {
                const prevInstId = previous.instituicao_id;
                const newInstId = updated.instituicao_id;
                const prevValor = Number(previous.valor_aporte) || 0;
                const newValor = Number(updated.valor_aporte) || 0;

                if (prevInstId && newInstId && prevInstId !== newInstId) {
                    // Troca de instituição: subtrai tudo da anterior e soma tudo na nova
                    const prevAccount = accounts.find(a => a.id === prevInstId);
                    if (prevAccount) {
                        const newBalancePrev = (prevAccount.saldo || 0) - prevValor;
                        const { data: accDataPrev, error: accErrPrev } = await supabase
                            .from('contas_bancarias')
                            .update({ saldo: newBalancePrev })
                            .eq('id', prevAccount.id)
                            .select();
                        if (!accErrPrev && accDataPrev?.[0]) {
                            setAccounts(prev => prev.map(a => a.id === prevAccount.id ? accDataPrev[0] : a));
                        }
                    }
                    const newAccount = accounts.find(a => a.id === newInstId);
                    if (newAccount) {
                        const newBalanceNew = (newAccount.saldo || 0) + newValor;
                        const { data: accDataNew, error: accErrNew } = await supabase
                            .from('contas_bancarias')
                            .update({ saldo: newBalanceNew })
                            .eq('id', newAccount.id)
                            .select();
                        if (!accErrNew && accDataNew?.[0]) {
                            setAccounts(prev => prev.map(a => a.id === newAccount.id ? accDataNew[0] : a));
                        }
                    }
                } else if (!prevInstId && newInstId) {
                    // Antes sem instituição, agora com: soma valor completo
                    const newAccount = accounts.find(a => a.id === newInstId);
                    if (newAccount) {
                        const newBalance = (newAccount.saldo || 0) + newValor;
                        const { data: accData, error: accErr } = await supabase
                            .from('contas_bancarias')
                            .update({ saldo: newBalance })
                            .eq('id', newAccount.id)
                            .select();
                        if (!accErr && accData?.[0]) {
                            setAccounts(prev => prev.map(a => a.id === newAccount.id ? accData[0] : a));
                        }
                    }
                } else if (prevInstId && !newInstId) {
                    // Antes com instituição, agora sem: subtrai valor completo
                    const prevAccount = accounts.find(a => a.id === prevInstId);
                    if (prevAccount) {
                        const newBalance = (prevAccount.saldo || 0) - prevValor;
                        const { data: accData, error: accErr } = await supabase
                            .from('contas_bancarias')
                            .update({ saldo: newBalance })
                            .eq('id', prevAccount.id)
                            .select();
                        if (!accErr && accData?.[0]) {
                            setAccounts(prev => prev.map(a => a.id === prevAccount.id ? accData[0] : a));
                        }
                    }
                } else if (newInstId && prevInstId === newInstId) {
                    // Mesma instituição: ajusta somente pela diferença do aporte
                    const diff = newValor - prevValor;
                    if (diff !== 0) {
                        const account = accounts.find(a => a.id === newInstId);
                        if (account) {
                            const newBalance = (account.saldo || 0) + diff;
                            const { data: accData, error: accErr } = await supabase
                                .from('contas_bancarias')
                                .update({ saldo: newBalance })
                                .eq('id', account.id)
                                .select();
                            if (!accErr && accData?.[0]) {
                                setAccounts(prev => prev.map(a => a.id === account.id ? accData[0] : a));
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Erro ao ajustar saldos de instituições ao editar aporte:', e);
        }
        return data[0];
    };

    const deleteInvestment = async (id) => {
        // Encontrar investimento para descontar do saldo da instituição
        const toDelete = investments.find(i => i.id === id);
        const { error } = await supabase.from('investimentos').delete().eq('id', id);
        if (error) throw error;
        setInvestments(prev => prev.filter(i => i.id !== id));

        // Desconta do saldo da instituição
        try {
            if (toDelete?.instituicao_id) {
                const account = accounts.find(a => a.id === toDelete.instituicao_id);
                if (account) {
                    const newBalance = (account.saldo || 0) - (toDelete.valor_aporte || 0);
                    const { data: accData, error: accErr } = await supabase
                        .from('contas_bancarias')
                        .update({ saldo: newBalance })
                        .eq('id', account.id)
                        .select();
                    if (!accErr && accData?.[0]) {
                        setAccounts(prev => prev.map(a => a.id === account.id ? accData[0] : a));
                    }
                }
            }
        } catch (e) {
            console.error('Erro ao atualizar saldo da instituição após excluir aporte:', e);
        }
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

    // Calcular patrimônio total (soma de todas as instituições)
    const totalPatrimony = accounts.reduce((total, account) => total + (account.saldo || 0), 0);

    return {
        expenses,
        investments,
        accounts,
        categories,
        investmentGoal,
        totalPatrimony,
        setInvestmentGoal: handleSetInvestmentGoal,
        loading,
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
        fetchData,
    };
}
