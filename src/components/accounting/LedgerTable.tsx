
"use client";

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import type { Transaction, Account, LedgerEntry } from '@/lib/types';
import { useAccounting } from '@/context/AccountingContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { TransactionFormDialog } from './TransactionFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit, ArrowDownUp, Search, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { cn } from "@/lib/utils";

interface LedgerTableProps {
  account: Account;
}

// PDF generation is mocked. In Electron, you'd use a library like `pdfmake` or Puppeteer.
const generatePdfMock = (accountName: string, headers: string[], data: (string|number)[][], lineLimit?: number) => {
  const reportTitle = `Transaction Report for ${accountName}`;
  const generationDate = `Generated on: ${format(new Date(), 'M/d/yyyy')}`;
  
  console.log(reportTitle);
  console.log(generationDate);
  console.log("Headers:", headers);
  
  const dataToExport = lineLimit && lineLimit > 0 ? data.slice(0, lineLimit) : data;
  console.log("Data:", dataToExport);
  
  const lineLimitText = lineLimit && lineLimit > 0 ? `_first_${lineLimit}_lines` : '_all_lines';
  const fileName = `${accountName.replace(/\s+/g, '_')}_Ledger_${format(new Date(), 'yyyy-MM-dd')}${lineLimitText}.txt`;

  alert(`PDF "${reportTitle}" (up to ${lineLimit && lineLimit > 0 ? lineLimit : 'all'} lines) would be generated as "${fileName}". Check console for data.`);
  
  // Simulate download with a text file
  let content = `${reportTitle}\n${generationDate}\n\n`;
  content += headers.join("\t") + "\n"; // Use tab separation for better text file readability
  content += dataToExport.map(row => row.join("\t")).join("\n");
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


export function LedgerTable({ account }: LedgerTableProps) {
  const { transactions, getAccountById, deleteTransaction } = useAccounting();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof LedgerEntry | 'balance' | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showPdfExportDialog, setShowPdfExportDialog] = useState(false);
  const [pdfLineLimit, setPdfLineLimit] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const ledgerEntries = useMemo(() => {
    const directTransactions = transactions
      .filter(tx => tx.accountId === account.id)
      .map(tx => ({
        ...tx,
        isMirror: false,
        originalAccountId: tx.accountId,
        displayCode: tx.codeAccountId ? getAccountById(tx.codeAccountId)?.name || 'Unknown Account' : '',
      }));

    const mirroredTransactions = transactions
      .filter(tx => tx.codeAccountId === account.id)
      .map(tx => ({
        ...tx,
        id: tx.id, 
        accountId: account.id,
        debit: tx.credit,
        credit: tx.debit,
        codeAccountId: tx.accountId,
        isMirror: true,
        originalAccountId: tx.accountId,
        displayCode: getAccountById(tx.accountId)?.name || 'Unknown Account',
      }));
    
    return [...directTransactions, ...mirroredTransactions];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, account.id, getAccountById, refreshKey]);


  const filteredAndSortedEntries = useMemo(() => {
    let processedEntries = ledgerEntries.filter(entry =>
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.slipNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      format(new Date(entry.date), 'yyyy-MM-dd').includes(searchTerm.toLowerCase()) ||
      entry.displayCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortColumn && sortColumn !== 'balance') { // Balance sorting is handled later with running balance
      processedEntries.sort((a, b) => {
        let valA = a[sortColumn as keyof LedgerEntry];
        let valB = b[sortColumn as keyof LedgerEntry];

        if (sortColumn === 'debit' || sortColumn === 'credit') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else if (sortColumn === 'date') {
          valA = new Date(valA as string).getTime();
          valB = new Date(valB as string).getTime();
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; 
      });
    }
    return processedEntries;
  }, [ledgerEntries, searchTerm, sortColumn, sortDirection]);

  const entriesWithRunningBalance = useMemo(() => {
    let currentBalance = 0;
    const entriesToProcess = [...filteredAndSortedEntries]; // Create a copy to sort if needed

    // If sorting by date for balance calculation, ensure it's ascending for correct accumulation.
    // However, the display sort might be different. For running balance, canonical order is by date.
    // The `filteredAndSortedEntries` should already be sorted as per user's choice for display.
    // The running balance should respect this display sort.

    return entriesToProcess.map(entry => {
      currentBalance += entry.debit - entry.credit;
      return { ...entry, balance: currentBalance };
    });
  }, [filteredAndSortedEntries]);
  
  // Apply sorting for 'balance' column if selected, after running balance is calculated
  const finalDisplayedEntries = useMemo(() => {
    if (sortColumn === 'balance') {
      return [...entriesWithRunningBalance].sort((a, b) => {
        const balanceA = a.balance || 0;
        const balanceB = b.balance || 0;
        if (balanceA < balanceB) return sortDirection === 'asc' ? -1 : 1;
        if (balanceA > balanceB) return sortDirection === 'asc' ? 1 : -1;
        // Secondary sort by date if balances are equal
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    return entriesWithRunningBalance;
  }, [entriesWithRunningBalance, sortColumn, sortDirection]);


  const handleSort = (column: keyof LedgerEntry | 'balance') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortArrow = (column: keyof LedgerEntry | 'balance') => {
    if (sortColumn === column) {
      return <ArrowDownUp className={`inline ml-1 h-3 w-3 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />;
    }
    return <ArrowDownUp className="inline ml-1 h-3 w-3 opacity-30" />;
  };

  const handleDelete = async (transactionId: string) => {
    const originalTx = transactions.find(tx => tx.id === transactionId);
    if (!originalTx) return;
    await deleteTransaction(originalTx.id);
    handleTransactionUpdate();
  };
  
  const handlePdfExport = () => {
    const headers = ["#", "Date", "Description", "Slip No.", "Debit", "Credit", "Balance"];
    // Use finalDisplayedEntries for PDF to match what user sees including sort order.
    // However, running balance in PDF should ideally always be chronological.
    // For simplicity of this mock, we'll use the currently displayed order.
    const dataForPdf = finalDisplayedEntries.map((entry, index) => [
      index + 1,
      format(new Date(entry.date), 'dd MMM yyyy'), // Changed date format
      entry.description,
      entry.slipNo,
      entry.debit > 0 ? entry.debit.toFixed(2) : '-',
      entry.credit > 0 ? entry.credit.toFixed(2) : '-',
      (entry.balance ?? 0).toFixed(2), // Use calculated running balance
    ]);
    
    const limit = pdfLineLimit ? parseInt(pdfLineLimit, 10) : undefined;
    if (pdfLineLimit && (isNaN(limit!) || limit! <= 0)) {
        alert("Please enter a valid positive line number for PDF export.");
        return;
    }
    generatePdfMock(account.name, headers, dataForPdf, limit);
    setShowPdfExportDialog(false);
    setPdfLineLimit('');
  };


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold font-headline text-primary">{account.name} - Ledger</CardTitle>
            <CardDescription>Manage transactions for this account.</CardDescription>
          </div>
          <div className="flex gap-2">
            <TransactionFormDialog accountId={account.id} onFormSubmit={handleTransactionUpdate} />
             <AlertDialog open={showPdfExportDialog} onOpenChange={setShowPdfExportDialog}>
                <AlertDialogTrigger asChild>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Export Ledger to PDF</AlertDialogTitle>
                        <AlertDialogDescription>
                            Generate a TXT (mock PDF) of the current ledger view. You can export all entries or up to a specific line. The "Code" column will be excluded.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 my-4">
                        <Button onClick={() => { setPdfLineLimit(''); handlePdfExport(); }} className="w-full">
                            <FileText className="mr-2 h-4 w-4" /> Generate Full Report
                        </Button>
                        <div>
                            <Label htmlFor="pdfLineLimit">Generate report up to line number (optional):</Label>
                            <Input 
                                id="pdfLineLimit"
                                type="number"
                                placeholder="e.g., 100"
                                value={pdfLineLimit}
                                onChange={(e) => setPdfLineLimit(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePdfExport} disabled={!!pdfLineLimit && parseInt(pdfLineLimit) <=0}>
                            Generate Selected Report
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="mt-4">
          <InputWithIcon
            placeholder="Search transactions (Date, Desc, Slip, Code)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            aria-label="Search transactions"
            icon={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[50px]">No.</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>Date {renderSortArrow('date')}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>Description {renderSortArrow('description')}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('slipNo')}>Slip No. {renderSortArrow('slipNo')}</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('debit')}>Debit {renderSortArrow('debit')}</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('credit')}>Credit {renderSortArrow('credit')}</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('balance')}>Balance {renderSortArrow('balance')}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('displayCode')}>Code {renderSortArrow('displayCode')}</TableHead>
                <TableHead className="w-[120px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalDisplayedEntries.length > 0 ? (
                finalDisplayedEntries.map((entry, index) => {
                  const originalTransactionForActions = transactions.find(t => t.id === entry.id);
                  return (
                  <TableRow key={entry.id + (entry.isMirror ? '-mirror' : '') + `-${index}`} className={`${entry.isMirror ? 'bg-muted/30 hover:bg-muted/50' : ''} transition-colors`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={entry.description}>{entry.description}</TableCell>
                    <TableCell>{entry.slipNo}</TableCell>
                    <TableCell className="text-right font-mono">{entry.debit > 0 ? entry.debit.toFixed(2) : '-'}</TableCell>
                    <TableCell className="text-right font-mono">{entry.credit > 0 ? entry.credit.toFixed(2) : '-'}</TableCell>
                    <TableCell className="text-right font-mono">{(entry.balance ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{entry.displayCode}</TableCell>
                    <TableCell className="text-center">
                      {originalTransactionForActions && (
                        <>
                          <TransactionFormDialog accountId={originalTransactionForActions.accountId} transactionToEdit={originalTransactionForActions} onFormSubmit={handleTransactionUpdate}/>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Delete Transaction">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the transaction
                                  {originalTransactionForActions.codeAccountId && ` and its linked entry in account "${getAccountById(originalTransactionForActions.codeAccountId)?.name}"`}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(originalTransactionForActions.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                )})
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                    No transactions found for this account.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}
const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</div>}
        <Input
          type={type}
          className={cn("pl-10", className)}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
InputWithIcon.displayName = "InputWithIcon";

