// Sistema centralizado de tratamento de erros
export class AppError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

export const ErrorCodes = {
  // Autenticação
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  
  // Validação
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Banco de dados
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  
  // Rede
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Sistema
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

export const handleError = (error, context = '') => {
  console.error(`[${context}] Error:`, error);
  
  // Se já é um AppError, retorna como está
  if (error instanceof AppError) {
    return error;
  }
  
  // Tratamento de erros do Supabase
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return new AppError('Registro não encontrado', ErrorCodes.RECORD_NOT_FOUND, 404);
      case '23505':
        return new AppError('Registro duplicado', ErrorCodes.DUPLICATE_RECORD, 409);
      case '23503':
        return new AppError('Violação de chave estrangeira', ErrorCodes.DATABASE_ERROR, 400);
      default:
        return new AppError(
          error.message || 'Erro no banco de dados',
          ErrorCodes.DATABASE_ERROR,
          500
        );
    }
  }
  
  // Tratamento de erros de rede
  if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
    return new AppError(
      'Erro de conexão. Verifique sua internet e tente novamente.',
      ErrorCodes.NETWORK_ERROR,
      503
    );
  }
  
  // Erro desconhecido
  return new AppError(
    error?.message || 'Ocorreu um erro inesperado',
    ErrorCodes.UNKNOWN_ERROR,
    500
  );
};

export const getErrorMessage = (error) => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return error?.message || 'Ocorreu um erro inesperado';
};

export const getErrorCode = (error) => {
  if (error instanceof AppError) {
    return error.code;
  }
  
  return ErrorCodes.UNKNOWN_ERROR;
};
