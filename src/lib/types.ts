export interface Account {
  id: string;
  name: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string; // The account this transaction primarily belongs to
  date: string; // YYYY-MM-DD
  description: string;
  slipNo: string; // User-defined, must be unique across all transactions
  debit: number;
  credit: number;
  codeAccountId?: string; // ID of the account named in 'Code' column, if any
  createdAt: string;
}

// Represents a transaction row as displayed in the ledger, which might be direct or mirrored
export interface LedgerEntry extends Transaction {
  isMirror: boolean; // True if this entry is a mirrored representation from another account
  originalAccountId: string; // If mirrored, this is the ID of the account where the original transaction resides
  displayCode: string; // Account name to display in the Code column
}

export interface AppData {
  accounts: Account[];
  transactions: Transaction[];
}

export interface SlipNoValidationResult {
  unique: boolean;
  conflictingAccountName?: string;
  conflictingTransactionDate?: string;
  conflictingTransactionDescription?: string;
  conflictingTransactionSlipNo?: string;
}
