import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useValidation } from '@/hooks/useValidation';
// import { useSupabaseCache } from '@/lib/cache';

export const useFinanceData = () => {
    const { user } = useAuth();
    const { validateExpense, validateInvestment, validateAccount, validateCategory, validateInvestmentGoal, sanitizeText } = useValidation();
    // const { getCachedData, invalidateCache } = useSupabaseCache();
    // const { handleError } = useErrorHandler();
    // const { isLoading, startLoading, stopLoading } = useLoading();
    const [isLoading, setIsLoading] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [investments, setInvestments] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [incomes, setIncomes] = useState([]);
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

            // Buscar meios de pagamento com política de override:
            // - Padrões (usuario_id = NULL) apenas ativos
            // - Do usuário (usuario_id = user.id) ativos e inativos (inativo serve para suprimir um padrão)
            const [defaultsRes, userRes] = await Promise.all([
                supabase
                    .from('meios_pagamento')
                    .select('*')
                    .is('usuario_id', null)
                    .eq('ativo', true)
                    .order('nome', { ascending: true }),
                supabase
                    .from('meios_pagamento')
                    .select('*')
                    .eq('usuario_id', user.id)
                    .order('nome', { ascending: true })
            ]);

            if (defaultsRes.error) throw defaultsRes.error;
            if (userRes.error) throw userRes.error;

            const defaults = defaultsRes.data || [];
            const userMethods = userRes.data || [];

            // Nomes suprimidos via overrides inativos (marcadores de exclusão)
            const suppressedNames = new Set(
                userMethods
                    .filter(pm => pm.ativo === false && pm.nome)
                    .map(pm => pm.nome)
            );

            // Filtra padrões que tenham sido suprimidos pelo usuário
            const visibleDefaults = defaults.filter(d => !suppressedNames.has(d.nome));

            // Apenas métodos do usuário ativos são exibidos
            const activeUserMethods = userMethods.filter(pm => pm.ativo !== false);

            // Evita duplicação por nome: se o usuário tem um ativo com mesmo nome de um padrão, mantém o do usuário
            const userNames = new Set(activeUserMethods.map(pm => pm.nome).filter(Boolean));
            const effectiveDefaults = visibleDefaults.filter(d => !userNames.has(d.nome));

            const effectivePaymentMethods = [...activeUserMethods, ...effectiveDefaults]
                .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

            setPaymentMethods(effectivePaymentMethods);

            // Buscar gastos
            const { data: expensesData, error: expensesError } = await supabase
                .from('gastos')
                .select('*')
                .eq('usuario_id', user.id)
                .order('data', { ascending: false });
            if (expensesError) throw expensesError;
            setExpenses(expensesData || []);

            // Buscar receitas
            const { data: incomesData, error: incomesError } = await supabase
                .from('receitas')
                .select('*')
                .eq('usuario_id', user.id)
                .order('data', { ascending: false });
            if (incomesError) throw incomesError;
            setIncomes(incomesData || []);

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
        
        // Validar dados de entrada
        const validation = validateExpense(expenseData);
        if (!validation.isValid) {
            throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
        }
        
        // Sanitizar dados
        const sanitizedData = {
            ...expenseData,
            descricao: sanitizeText(expenseData.descricao),
            usuario_id: user.id
        };
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('gastos')
                .insert([sanitizedData])
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
    }, [user, validateExpense, sanitizeText]);

    const addIncome = useCallback(async (incomeData) => {
        if (!user) return;
        
        // Validações básicas
        if (!incomeData.descricao || incomeData.descricao.trim().length < 3) {
            throw new Error('Descrição deve ter pelo menos 3 caracteres');
        }
        if (!incomeData.valor || incomeData.valor <= 0) {
            throw new Error('Valor deve ser maior que zero');
        }
        if (!incomeData.data) {
            throw new Error('Data é obrigatória');
        }
        
        // Sanitizar dados
        const sanitizedData = {
            ...incomeData,
            descricao: sanitizeText(incomeData.descricao),
            usuario_id: user.id
        };
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('receitas')
                .insert([sanitizedData])
                .select()
                .single();
            
            if (error) throw error;
            setIncomes(prev => [data, ...prev]);
            return data;
        } catch (error) {
            console.error('Erro ao adicionar receita:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user, sanitizeText]);

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

    const updateIncome = useCallback(async (id, updates) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('receitas')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            setIncomes(prev => prev.map(income => 
                income.id === id ? data : income
            ));
            return data;
        } catch (error) {
            console.error('Erro ao atualizar receita:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

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

    const deleteIncome = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('receitas')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setIncomes(prev => prev.filter(income => income.id !== id));
        } catch (error) {
            console.error('Erro ao excluir receita:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

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
            // Atualizar estado remove o investimento da lista
            // Isso automaticamente recalcula investmentsToAdd e totalPatrimony via useMemo
            // Se o investimento excluído era posterior ao ajuste da conta, ele será removido do patrimônio
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

    // Funções CRUD para meios de pagamento
    const addPaymentMethod = useCallback(async (paymentMethodData) => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('meios_pagamento')
                .insert([{ ...paymentMethodData, usuario_id: user.id }])
                .select()
                .single();
            
            if (error) throw error;
            // Ao criar um método do usuário, ele deve sobrepor um padrão com o mesmo nome
            setPaymentMethods(prev => {
                const withoutSuppressedDefault = prev.filter(pm => !(pm.usuario_id === null && pm.nome === data.nome));
                return [data, ...withoutSuppressedDefault];
            });
            return data;
        } catch (error) {
            console.error('Erro ao adicionar meio de pagamento:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const updatePaymentMethod = useCallback(async (id, updates) => {
        if (!user) {
            throw new Error('Usuário não autenticado');
        }
        
        setIsLoading(true);
        try {
            console.log('Tentando atualizar meio de pagamento:', id, updates);
            
            // Se o meio de pagamento é padrão (usuario_id = NULL), criar uma cópia personalizada
            const { data: existingPaymentMethod, error: fetchError } = await supabase
                .from('meios_pagamento')
                .select('id, usuario_id, nome, tipo, cor')
                .eq('id', id)
                .single();
            
            if (fetchError) {
                console.error('Erro ao buscar meio de pagamento:', fetchError);
                throw new Error('Meio de pagamento não encontrado');
            }
            
            if (existingPaymentMethod.usuario_id === null) {
                console.log('Criando versão personalizada do meio de pagamento padrão');
                
                // Criar uma nova versão personalizada para o usuário
                const { data: newPaymentMethod, error: createError } = await supabase
                    .from('meios_pagamento')
                    .insert([{
                        nome: updates.nome || existingPaymentMethod.nome,
                        tipo: updates.tipo || existingPaymentMethod.tipo,
                        cor: updates.cor || existingPaymentMethod.cor,
                        usuario_id: user.id,
                        ativo: true
                    }])
                    .select()
                    .single();
                
                if (createError) {
                    console.error('Erro ao criar meio de pagamento personalizado:', createError);
                    throw createError;
                }
                
                console.log('Meio de pagamento personalizado criado com sucesso:', newPaymentMethod);
                
                // Atualizar a lista local: remover o padrão e adicionar o personalizado
                setPaymentMethods(prev => {
                    const filtered = prev.filter(pm => pm.id !== id);
                    return [newPaymentMethod, ...filtered];
                });
                
                return newPaymentMethod;
            }
            
            // Atualizar meio de pagamento existente
            const { data, error } = await supabase
                .from('meios_pagamento')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                console.error('Erro do Supabase ao atualizar meio de pagamento:', error);
                throw error;
            }
            
            console.log('Meio de pagamento atualizado com sucesso:', data);
            setPaymentMethods(prev => prev.map(paymentMethod => 
                paymentMethod.id === id ? data : paymentMethod
            ));
            return data;
        } catch (error) {
            console.error('Erro ao atualizar meio de pagamento:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const deletePaymentMethod = useCallback(async (id) => {
        if (!user) {
            throw new Error('Usuário não autenticado');
        }
        
        setIsLoading(true);
        try {
            // Se for um meio padrão, criar uma versão personalizada "desativada" para o usuário
            const { data: existingPaymentMethod, error: fetchError } = await supabase
                .from('meios_pagamento')
                .select('id, usuario_id, nome, tipo, cor')
                .eq('id', id)
                .single();
            
            if (fetchError) {
                console.error('Erro ao buscar meio de pagamento:', fetchError);
                throw new Error('Meio de pagamento não encontrado');
            }
            
            if (existingPaymentMethod.usuario_id === null) {
                console.log('Criando versão desativada do meio de pagamento padrão');
                
                // Criar uma versão personalizada desativada para "ocultar" o padrão
                const { data: newPaymentMethod, error: createError } = await supabase
                    .from('meios_pagamento')
                    .insert([{
                        nome: existingPaymentMethod.nome,
                        tipo: existingPaymentMethod.tipo,
                        cor: existingPaymentMethod.cor,
                        usuario_id: user.id,
                        ativo: false // Desativado para "ocultar"
                    }])
                    .select()
                    .single();
                
                if (createError) {
                    console.error('Erro ao criar meio de pagamento desativado:', createError);
                    throw createError;
                }
                
                console.log('Meio de pagamento desativado com sucesso');
                
                // Remover da lista local
                setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
                return;
            }
            
            // Excluir meio de pagamento personalizado (não reativa padrões; padrão já está suprimido apenas se existir um registro inativo específico)
            const { error } = await supabase
                .from('meios_pagamento')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setPaymentMethods(prev => prev.filter(paymentMethod => paymentMethod.id !== id));
        } catch (error) {
            console.error('Erro ao excluir meio de pagamento:', error);
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

    // Calcular saldo total das contas bancárias
    const totalAccountBalance = useMemo(() => {
        return accounts.reduce((total, account) => {
            return total + Number(account.saldo || 0);
        }, 0);
    }, [accounts]);

    // Calcular investimentos que devem ser somados ao patrimônio
    // Lógica:
    // 1. Se uma conta foi ajustada (updated_at > created_at), o saldo ajustado é a "verdade absoluta"
    //    e apenas investimentos feitos APÓS o ajuste devem ser somados
    // 2. Se uma conta não foi ajustada, soma todos os investimentos dessa instituição
    // 3. Investimentos sem instituicao_id: se todas as contas foram ajustadas, usar a data do ajuste mais recente
    //    como referência. Se não, soma sempre (investimentos gerais)
    // IMPORTANTE: Este cálculo é recalculado automaticamente quando investments ou accounts mudam
    // (por exemplo, quando um investimento é excluído via deleteInvestment ou uma conta é atualizada)
    const investmentsToAdd = useMemo(() => {
        if (!investments.length) return 0;

        // Criar um mapa de contas com data de último ajuste
        const accountAdjustmentDates = accounts.reduce((map, account) => {
            const createdDate = account.created_at ? new Date(account.created_at) : null;
            const updatedDate = account.updated_at ? new Date(account.updated_at) : null;
            
            // Se updated_at existe e é posterior a created_at, houve ajuste
            // Usar uma margem maior (5 segundos) para evitar problemas de precisão de timestamp
            const hasAdjustment = updatedDate && createdDate && 
                                 updatedDate.getTime() > createdDate.getTime() + 5000;
            
            // Se houve ajuste, usar updated_at como data de referência
            // Caso contrário, usar null (significa que não houve ajuste, então soma todos os investimentos)
            const adjustmentDate = hasAdjustment ? updatedDate : null;
            
            map[account.id] = adjustmentDate;
            return map;
        }, {});

        // Encontrar a data do ajuste mais recente (para investimentos sem instituição)
        const allAdjustmentDates = Object.values(accountAdjustmentDates).filter(date => date !== null);
        const latestAdjustmentDate = allAdjustmentDates.length > 0 
            ? new Date(Math.max(...allAdjustmentDates.map(d => d.getTime())))
            : null;

        // Verificar se todas as contas foram ajustadas
        const allAccountsAdjusted = accounts.length > 0 && 
                                   accounts.every(account => {
                                       const adjustmentDate = accountAdjustmentDates[account.id];
                                       return adjustmentDate !== null;
                                   });

        // Somar investimentos que devem ser considerados
        return investments.reduce((total, investment) => {
            // Usar valor_aporte (valor do aporte feito)
            const valorAporte = Number(investment.valor_aporte || 0);
            
            if (!investment.instituicao_id) {
                // Investimento sem instituição
                if (allAccountsAdjusted && latestAdjustmentDate) {
                    // Se todas as contas foram ajustadas, só soma investimentos após o ajuste mais recente
                    const investmentDate = new Date(investment.data + 'T00:00:00'); // Garantir que é meia-noite para comparação correta
                    const investmentDateOnly = new Date(investmentDate.getFullYear(), investmentDate.getMonth(), investmentDate.getDate());
                    const latestAdjustmentDateOnly = new Date(latestAdjustmentDate.getFullYear(), latestAdjustmentDate.getMonth(), latestAdjustmentDate.getDate());
                    
                    // Se o investimento foi feito na mesma data ou após o ajuste mais recente, soma
                    if (investmentDateOnly.getTime() >= latestAdjustmentDateOnly.getTime()) {
                        return total + valorAporte;
                    }
                    return total;
                } else {
                    // Se nem todas as contas foram ajustadas, soma sempre (investimento geral)
                    return total + valorAporte;
                }
            }

            const adjustmentDate = accountAdjustmentDates[investment.instituicao_id];
            
            if (!adjustmentDate) {
                // Se não há data de ajuste (conta nunca foi ajustada), soma sempre
                return total + valorAporte;
            }

            // Verificar se o investimento foi feito após o ajuste
            // IMPORTANTE: Se o investimento foi feito na mesma data ou após o ajuste, ele deve ser somado
            const investmentDate = new Date(investment.data + 'T00:00:00'); // Garantir que é meia-noite para comparação correta
            
            // Comparar apenas as datas (sem hora) para evitar problemas de timezone
            const investmentDateOnly = new Date(investmentDate.getFullYear(), investmentDate.getMonth(), investmentDate.getDate());
            const adjustmentDateOnly = new Date(adjustmentDate.getFullYear(), adjustmentDate.getMonth(), adjustmentDate.getDate());
            
            // Se o investimento foi feito na mesma data ou após o ajuste, soma
            // (>= significa que investimentos do mesmo dia também são considerados)
            if (investmentDateOnly.getTime() >= adjustmentDateOnly.getTime()) {
                // Investimento na mesma data ou após o ajuste: soma
                return total + valorAporte;
            }
            // Investimento antes do ajuste: não soma (já está incluído no saldo ajustado)
            return total;
        }, 0);
    }, [accounts, investments]);

    // Calcular total de investimentos (soma de todos os aportes, sem considerar ajustes)
    // Mantido para compatibilidade com outros componentes que precisam do total bruto
    const totalInvestmentBalance = useMemo(() => {
        return investments.reduce((total, investment) => {
            const valor = investment.valor_aporte || 0;
            return total + Number(valor);
        }, 0);
    }, [investments]);

    // Calcular patrimônio total: saldos das contas (valores ajustados) + investimentos futuros
    // Lógica: 
    // - O saldo da conta é o valor base (ajustado manualmente ou inicial)
    // - Investimentos feitos após o ajuste somam ao patrimônio
    // - Investimentos anteriores ao ajuste já estão incluídos no saldo ajustado
    const totalPatrimony = useMemo(() => {
        // Patrimônio = saldos das contas (valores ajustados) + investimentos futuros
        return totalAccountBalance + investmentsToAdd;
    }, [totalAccountBalance, investmentsToAdd]);

    // Computed values para receitas
    const totalIncome = useMemo(() => {
        return incomes.reduce((total, income) => total + income.valor, 0);
    }, [incomes]);

    const availableBalance = useMemo(() => {
        const totalPaidExpenses = expenses.filter(exp => exp.pago).reduce((sum, exp) => sum + exp.valor, 0);
        const totalInvestments = investments.reduce((sum, inv) => sum + inv.valor_aporte, 0);
        return totalIncome - totalPaidExpenses - totalInvestments;
    }, [totalIncome, expenses, investments]);
    

    return {
        expenses,
        investments,
        accounts,
        categories,
        paymentMethods,
        incomes,
        investmentGoal,
        totalPatrimony,
        totalInvestmentBalance,
        totalAccountBalance,
        totalIncome,
        availableBalance,
        isLoading,
        fetchData,
        addExpense,
        updateExpense,
        deleteExpense,
        toggleExpensePayment,
        addIncome,
        updateIncome,
        deleteIncome,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        handleSetInvestmentGoal
    };
};