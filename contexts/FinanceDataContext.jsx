import React, { createContext, useContext } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';

const FinanceContext = createContext(null);

export const FinanceDataProvider = ({ children }) => {
  const financeData = useFinanceData();
  return (
    <FinanceContext.Provider value={financeData}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceDataProvider');
  }
  return context;
};