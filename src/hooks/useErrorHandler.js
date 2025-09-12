import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { handleError, getErrorMessage, getErrorCode } from '@/lib/errorHandler';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isError, setIsError] = useState(false);
  const { toast } = useToast();

  const handleErrorWithToast = useCallback((error, context = '', showToast = true) => {
    const appError = handleError(error, context);
    setError(appError);
    setIsError(true);
    
    if (showToast) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: getErrorMessage(appError),
      });
    }
    
    return appError;
  }, [toast]);

  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);

  const handleAsync = useCallback(async (asyncFn, context = '', showToast = true) => {
    try {
      clearError();
      return await asyncFn();
    } catch (error) {
      return handleErrorWithToast(error, context, showToast);
    }
  }, [handleErrorWithToast, clearError]);

  return {
    error,
    isError,
    handleError: handleErrorWithToast,
    clearError,
    handleAsync,
    getErrorMessage: () => error ? getErrorMessage(error) : null,
    getErrorCode: () => error ? getErrorCode(error) : null,
  };
};
