import { createContext, useContext } from 'react';

export const FinanceDataContext = createContext(null);

export function useFinanceContext() {
  const value = useContext(FinanceDataContext);
  if (!value) {
    throw new Error('useFinanceContext must be used within FinanceLayout');
  }
  return value;
}
