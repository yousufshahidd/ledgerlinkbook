"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Account, Transaction, AppData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'ledgerLocalData';

interface AccountingContextType {
  accounts: Account[];
  transactions: Transaction[];
  addAccount: (name: string) => Promise<Account | null>;
  getAccountById: (id: string) => Account | undefined;
  getAccountByName: (name: string) => Account | undefined;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction | null>;
  updateTransaction: (tx: Transaction) => Promise<Transaction | null>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsForAccount: (accountId: string) => Transaction[];
  isSlipNoUnique: (slipNo: string, currentTransactionId?: string) => boolean;
  backupData: () => void;
  restoreData: (jsonData: string) => Promise<boolean>;
  isLoading: boolean;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData: AppData = JSON.parse(storedData);
        setAccounts(parsedData.accounts || []);
        setTransactions(parsedData.transactions || []);
      } else {
        // Initialize with empty arrays if no data
        setAccounts([]);
        setTransactions([]);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      toast({ title: "Error", description: "Failed to load data. Storage might be corrupted.", variant: "destructive" });
      setAccounts([]);
      setTransactions([]);
    }
    setIsLoading(false);
  }, [toast]);

  const saveData = useCallback(() => {
    try {
      const dataToStore: AppData = { accounts, transactions };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error("Failed to save data to localStorage:", error);
      toast({ title: "Error", description: "Failed to save data.", variant: "destructive" });
    }
  }, [accounts, transactions, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: saveData should run when accounts or transactions change
  useEffect(() => {
    if (!isLoading) { // Avoid saving initial empty state before loading
      saveData();
    }
  }, [accounts, transactions, saveData, isLoading]);


  const getAccountById = useCallback((id: string) => accounts.find(acc => acc.id === id), [accounts]);
  const getAccountByName = useCallback((name: string) => accounts.find(acc => acc.name.toLowerCase() === name.toLowerCase()), [accounts]);

  const addAccount = async (name: string): Promise<Account | null> => {
    if (getAccountByName(name)) {
      toast({ title: "Error", description: `Account with name "${name}" already exists.`, variant: "destructive" });
      return null;
    }
    const newAccount: Account = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() };
    setAccounts(prev => [...prev, newAccount]);
    toast({ title: "Success", description: `Account "${name}" created.` });
    return newAccount;
  };

  const isSlipNoUnique = useCallback((slipNo: string, currentTransactionId?: string) => {
    return !transactions.some(tx => tx.slipNo === slipNo && tx.id !== currentTransactionId);
  }, [transactions]);

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction | null> => {
    if (!isSlipNoUnique(txData.slipNo)) {
      const existingTx = transactions.find(t => t.slipNo === txData.slipNo);
      const existingAcc = existingTx ? getAccountById(existingTx.accountId) : null;
      const errorMessage = existingAcc
        ? `Slip No. "${txData.slipNo}" already used in account "${existingAcc.name}".`
        : `Slip No. "${txData.slipNo}" is already in use.`;
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      return null;
    }

    const newTransaction: Transaction = {
      ...txData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ));
    toast({ title: "Success", description: "Transaction added." });
    return newTransaction;
  };

  const updateTransaction = async (updatedTx: Transaction): Promise<Transaction | null> => {
    if (!isSlipNoUnique(updatedTx.slipNo, updatedTx.id)) {
      const existingTx = transactions.find(t => t.slipNo === updatedTx.slipNo && t.id !== updatedTx.id);
      const existingAcc = existingTx ? getAccountById(existingTx.accountId) : null;
      const errorMessage = existingAcc
        ? `Slip No. "${updatedTx.slipNo}" already used in account "${existingAcc.name}".`
        : `Slip No. "${updatedTx.slipNo}" is already in use.`;
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      return null;
    }

    setTransactions(prev =>
      prev.map(tx => (tx.id === updatedTx.id ? updatedTx : tx))
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
    toast({ title: "Success", description: "Transaction updated." });
    return updatedTx;
  };

  const deleteTransaction = async (transactionId: string): Promise<void> => {
    setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
    toast({ title: "Success", description: "Transaction deleted." });
  };
  
  const getTransactionById = useCallback((id: string) => transactions.find(tx => tx.id === id), [transactions]);

  const getTransactionsForAccount = useCallback((accountId: string) => {
    return transactions.filter(tx => tx.accountId === accountId || tx.codeAccountId === accountId)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions]);


  const backupData = () => {
    try {
      const dataToStore: AppData = { accounts, transactions };
      const jsonData = JSON.stringify(dataToStore, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `ledger_local_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Data backup downloaded." });
    } catch (error) {
      console.error("Backup failed:", error);
      toast({ title: "Error", description: "Data backup failed.", variant: "destructive" });
    }
  };

  const restoreData = async (jsonData: string): Promise<boolean> => {
    try {
      const parsedData: AppData = JSON.parse(jsonData);
      if (parsedData.accounts && parsedData.transactions) {
        setAccounts(parsedData.accounts);
        setTransactions(parsedData.transactions);
        // saveData(); // Data will be saved by useEffect on accounts/transactions change
        toast({ title: "Success", description: "Data restored successfully." });
        return true;
      }
      toast({ title: "Error", description: "Invalid backup file format.", variant: "destructive" });
      return false;
    } catch (error) {
      console.error("Restore failed:", error);
      toast({ title: "Error", description: "Data restore failed. Invalid JSON.", variant: "destructive" });
      return false;
    }
  };

  return (
    <AccountingContext.Provider value={{
      accounts,
      transactions,
      addAccount,
      getAccountById,
      getAccountByName,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionById,
      getTransactionsForAccount,
      isSlipNoUnique,
      backupData,
      restoreData,
      isLoading
    }}>
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = (): AccountingContextType => {
  const context = useContext(AccountingContext);
  if (context === undefined) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};
