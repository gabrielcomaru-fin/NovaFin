import { useCallback } from 'react';

/**
 * Hook para validação de dados de entrada
 * @returns {Object} Funções de validação
 */
export const useValidation = () => {
  /**
   * Valida dados de despesa
   * @param {Object} data - Dados da despesa
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  const validateExpense = useCallback((data) => {
    const errors = [];
    
    // Validar valor
    if (!data.valor || typeof data.valor !== 'number' || data.valor <= 0) {
      errors.push('Valor deve ser um número positivo');
    }
    
    // Validar data
    if (!data.data || isNaN(new Date(data.data).getTime())) {
      errors.push('Data deve ser válida');
    }
    
    // Validar categoria
    if (!data.categoria_id || typeof data.categoria_id !== 'string') {
      errors.push('Categoria é obrigatória');
    }
    
    // Validar descrição
    if (!data.descricao || data.descricao.trim().length === 0) {
      errors.push('Descrição é obrigatória');
    }
    
    // Validar tamanho da descrição
    if (data.descricao && data.descricao.length > 255) {
      errors.push('Descrição deve ter no máximo 255 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Valida dados de investimento
   * @param {Object} data - Dados do investimento
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  const validateInvestment = useCallback((data) => {
    const errors = [];
    
    // Validar valor do aporte
    if (!data.valor_aporte || typeof data.valor_aporte !== 'number' || data.valor_aporte <= 0) {
      errors.push('Valor do aporte deve ser um número positivo');
    }
    
    // Validar data
    if (!data.data || isNaN(new Date(data.data).getTime())) {
      errors.push('Data deve ser válida');
    }
    
    // Validar tipo de investimento
    if (!data.tipo || typeof data.tipo !== 'string') {
      errors.push('Tipo de investimento é obrigatório');
    }
    
    // Validar nome do investimento
    if (!data.nome || data.nome.trim().length === 0) {
      errors.push('Nome do investimento é obrigatório');
    }
    
    // Validar tamanho do nome
    if (data.nome && data.nome.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Valida dados de conta bancária
   * @param {Object} data - Dados da conta
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  const validateAccount = useCallback((data) => {
    const errors = [];
    
    // Validar nome da conta
    if (!data.nome || data.nome.trim().length === 0) {
      errors.push('Nome da conta é obrigatório');
    }
    
    // Validar tamanho do nome
    if (data.nome && data.nome.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }
    
    // Validar saldo
    if (data.saldo !== undefined && (typeof data.saldo !== 'number' || data.saldo < 0)) {
      errors.push('Saldo deve ser um número não negativo');
    }
    
    // Validar teto de gastos
    if (data.teto_gasto !== undefined && (typeof data.teto_gasto !== 'number' || data.teto_gasto < 0)) {
      errors.push('Teto de gastos deve ser um número não negativo');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Valida dados de categoria
   * @param {Object} data - Dados da categoria
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  const validateCategory = useCallback((data) => {
    const errors = [];
    
    // Validar nome
    if (!data.nome || data.nome.trim().length === 0) {
      errors.push('Nome da categoria é obrigatório');
    }
    
    // Validar tamanho do nome
    if (data.nome && data.nome.length > 50) {
      errors.push('Nome deve ter no máximo 50 caracteres');
    }
    
    // Validar tipo
    if (!data.tipo || !['gasto', 'investimento'].includes(data.tipo)) {
      errors.push('Tipo deve ser "gasto" ou "investimento"');
    }
    
    // Validar cor
    if (data.cor && !/^#[0-9A-F]{6}$/i.test(data.cor)) {
      errors.push('Cor deve ser um código hexadecimal válido (ex: #FF0000)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Valida meta de investimento
   * @param {number} goal - Meta de investimento
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  const validateInvestmentGoal = useCallback((goal) => {
    const errors = [];
    
    if (typeof goal !== 'number' || goal < 0) {
      errors.push('Meta deve ser um número não negativo');
    }
    
    if (goal > 1000000) {
      errors.push('Meta não pode ser maior que R$ 1.000.000');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Sanitiza entrada de texto
   * @param {string} input - Texto de entrada
   * @returns {string} Texto sanitizado
   */
  const sanitizeText = useCallback((input) => {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<[^>]*>/g, '') // Remove tags HTML
      .replace(/[<>]/g, ''); // Remove caracteres perigosos
  }, []);

  /**
   * Valida email
   * @param {string} email - Email para validar
   * @returns {boolean} Se o email é válido
   */
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  /**
   * Valida senha
   * @param {string} password - Senha para validar
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  const validatePassword = useCallback((password) => {
    const errors = [];
    
    if (!password || password.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }
    
    if (password.length > 128) {
      errors.push('Senha deve ter no máximo 128 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  return {
    validateExpense,
    validateInvestment,
    validateAccount,
    validateCategory,
    validateInvestmentGoal,
    sanitizeText,
    validateEmail,
    validatePassword
  };
};
