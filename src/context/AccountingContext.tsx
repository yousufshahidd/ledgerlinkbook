
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Account, Transaction, AppData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'ledgerLocalData';

interface SlipNoValidationResult {
  unique: boolean;
  conflictingAccountName?: string;
}

interface AccountingContextType {
  accounts: Account[];
  transactions: Transaction[];
  addAccount: (name: string) => Promise<Account | null>;
  updateAccount: (accountId: string, newName: string) => Promise<Account | null>;
  deleteAccount: (accountId: string) => Promise<void>;
  getAccountById: (id: string) => Account | undefined;
  getAccountByName: (name: string) => Account | undefined;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction | null>;
  updateTransaction: (tx: Transaction) => Promise<Transaction | null>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsForAccount: (accountId: string) => Transaction[];
  isSlipNoUnique: (slipNo: string, currentTransactionId?: string) => SlipNoValidationResult;
  calculateAccountBalance: (accountId: string) => { balance: number; type: 'Dr' | 'Cr' | 'Zero' };
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
    if (!isLoading) {
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
    setAccounts(prev => [...prev, newAccount].sort((a,b) => a.name.localeCompare(b.name)));
    toast({ title: "Success", description: `Account "${name}" created.` });
    return newAccount;
  };

  const updateAccount = async (accountId: string, newName: string): Promise<Account | null> => {
    const existingAccountWithName = getAccountByName(newName);
    if (existingAccountWithName && existingAccountWithName.id !== accountId) {
      toast({ title: "Error", description: `Account with name "${newName}" already exists.`, variant: "destructive" });
      return null;
    }
    let updatedAccount: Account | null = null;
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === accountId) {
          updatedAccount = { ...acc, name: newName };
          return updatedAccount;
        }
        return acc;
      }).sort((a,b) => a.name.localeCompare(b.name))
    );
    if (updatedAccount) {
      toast({ title: "Success", description: `Account "${updatedAccount.name}" updated.` });
    }
    return updatedAccount;
  };

  const deleteAccount = async (accountId: string): Promise<void> => {
    const accountToDelete = getAccountById(accountId);
    if (!accountToDelete) {
        toast({ title: "Error", description: "Account not found for deletion.", variant: "destructive" });
        return;
    }
    setTransactions(prev => prev.filter(tx => tx.accountId !== accountId && tx.codeAccountId !== accountId));
    setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    toast({ title: "Success", description: `Account "${accountToDelete.name}" and its transactions deleted.` });
  };

  const isSlipNoUnique = useCallback((slipNo: string, currentTransactionId?: string): SlipNoValidationResult => {
    if (!slipNo || slipNo.trim() === '') return { unique: true };
    const conflictingTx = transactions.find(tx =>
      tx.slipNo.trim().toLowerCase() === slipNo.trim().toLowerCase() && tx.id !== currentTransactionId
    );

    if (conflictingTx) {
      const account = getAccountById(conflictingTx.accountId);
      return {
        unique: false,
        conflictingAccountName: account?.name || 'an unknown account',
      };
    }
    return { unique: true };
  }, [transactions, getAccountById]);

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction | null> => {
    const slipValidation = isSlipNoUnique(txData.slipNo.trim());
    if (!slipValidation.unique) {
      toast({
        title: "Error",
        description: `Slip No. "${txData.slipNo}" already used in account "${slipValidation.conflictingAccountName}".`,
        variant: "destructive"
      });
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
     const slipValidation = isSlipNoUnique(updatedTx.slipNo.trim(), updatedTx.id);
     if (!slipValidation.unique) {
      toast({
        title: "Error",
        description: `Slip No. "${updatedTx.slipNo}" already used in account "${slipValidation.conflictingAccountName}".`,
        variant: "destructive"
      });
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

  const calculateAccountBalance = useCallback((accountId: string): { balance: number; type: 'Dr' | 'Cr' | 'Zero' } => {
    const accountTransactions = transactions.reduce((acc, tx) => {
      if (tx.accountId === accountId) {
        acc.push(tx);
      } else if (tx.codeAccountId === accountId) {
        // Mirrored transaction: swap debit/credit
        acc.push({
          ...tx,
          debit: tx.credit,
          credit: tx.debit,
        });
      }
      return acc;
    }, [] as Transaction[]);

    const balance = accountTransactions.reduce((sum, tx) => sum + tx.debit - tx.credit, 0);

    if (balance > 0) return { balance, type: 'Dr' };
    if (balance < 0) return { balance: Math.abs(balance), type: 'Cr' }; // Return positive number for Cr display
    return { balance: 0, type: 'Zero' };
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
    setIsLoading(true);
    try {
      const parsedData: AppData = JSON.parse(jsonData);
      // Basic validation
      if (typeof parsedData === 'object' && parsedData !== null && Array.isArray(parsedData.accounts) && Array.isArray(parsedData.transactions)) {
        setAccounts(parsedData.accounts.sort((a,b) => a.name.localeCompare(b.name)));
        setTransactions(parsedData.transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        // saveData will be called by useEffect due to state change
        toast({ title: "Success", description: "Data restored successfully." });
        setIsLoading(false);
        return true;
      }
      toast({ title: "Error", description: "Invalid backup file format.", variant: "destructive" });
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error("Restore failed:", error);
      toast({ title: "Error", description: "Data restore failed. Invalid JSON.", variant: "destructive" });
      setIsLoading(false);
      return false;
    }
  };

  return (
    <AccountingContext.Provider value={{
      accounts,
      transactions,
      addAccount,
      updateAccount,
      deleteAccount,
      getAccountById,
      getAccountByName,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionById,
      getTransactionsForAccount,
      isSlipNoUnique,
      calculateAccountBalance,
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

