"use client";

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

interface LedgerTableProps {
  account: Account;
}

// PDF generation is mocked. In Electron, you'd use a library like `pdfmake` or Puppeteer.
const generatePdf = (title: string, headers: string[], data: (string|number)[][], lineLimit?: number) => {
  console.log(`Generating PDF: ${title}`);
  console.log("Headers:", headers);
  const dataToExport = lineLimit ? data.slice(0, lineLimit) : data;
  console.log("Data:", dataToExport);
  alert(`PDF "${title}" (up to line ${lineLimit || 'EOF'}) would be generated with ${dataToExport.length} rows. Check console for data.`);
  
  // Simulate download
  const content = `Title: ${title}\nHeaders: ${headers.join(", ")}\nData:\n${dataToExport.map(row => row.join(", ")).join("\n")}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0,10);
  a.download = `${title.replace(/\s+/g, '_')}_${dateStr}${lineLimit ? `_L${lineLimit}` : ''}.txt`; // Simulate PDF with TXT
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


export function LedgerTable({ account }: LedgerTableProps) {
  const { transactions, getAccountById, deleteTransaction } = useAccounting();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof LedgerEntry | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showPdfExportDialog, setShowPdfExportDialog] = useState(false);
  const [pdfLineLimit, setPdfLineLimit] = useState<string>('');
   const [refreshKey, setRefreshKey] = useState(0); // Used to force re-render/re-fetch of transactions

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
        ...tx, // Spread original tx first
        id: tx.id, // Ensure original ID is used for operations
        accountId: account.id, // This entry is for the current account's view
        debit: tx.credit, // Swap debit/credit
        credit: tx.debit,
        codeAccountId: tx.accountId, // Original account becomes the code
        isMirror: true,
        originalAccountId: tx.accountId,
        displayCode: getAccountById(tx.accountId)?.name || 'Unknown Account',
      }));
    
    return [...directTransactions, ...mirroredTransactions];
  }, [transactions, account.id, getAccountById, refreshKey]);


  const filteredAndSortedEntries = useMemo(() => {
    let processedEntries = ledgerEntries.filter(entry =>
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.slipNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      format(new Date(entry.date), 'yyyy-MM-dd').includes(searchTerm.toLowerCase()) ||
      entry.displayCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortColumn) {
      processedEntries.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

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
        
        // Secondary sort by createdAt to maintain stable order for same values
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Newest first
      });
    }
    return processedEntries;
  }, [ledgerEntries, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: keyof LedgerEntry) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortArrow = (column: keyof LedgerEntry) => {
    if (sortColumn === column) {
      return <ArrowDownUp className={`inline ml-1 h-3 w-3 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />;
    }
    return <ArrowDownUp className="inline ml-1 h-3 w-3 opacity-30" />;
  };

  const handleDelete = async (transactionId: string) => {
    // Find the original transaction, whether direct or mirror
    const originalTx = transactions.find(tx => tx.id === transactionId);
    if (!originalTx) return;

    await deleteTransaction(originalTx.id);
    handleTransactionUpdate(); // Refresh table
  };
  
  const handlePdfExport = () => {
    const headers = ["No.", "Date", "Description", "Slip No.", "Debit", "Credit"];
    const data = filteredAndSortedEntries.map((entry, index) => [
      index + 1,
      format(new Date(entry.date), 'dd/MM/yyyy'),
      entry.description,
      entry.slipNo,
      entry.debit > 0 ? entry.debit.toFixed(2) : '',
      entry.credit > 0 ? entry.credit.toFixed(2) : '',
    ]);
    const limit = pdfLineLimit ? parseInt(pdfLineLimit, 10) : undefined;
    if (pdfLineLimit && (isNaN(limit!) || limit! <= 0)) {
        alert("Please enter a valid positive line number.");
        return;
    }
    generatePdf(`${account.name}_Ledger`, headers, data, limit);
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
                            Generate a PDF of the current ledger view. You can export all entries or up to a specific line. The "Code" column will be excluded.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 my-4">
                        <Button onClick={() => { setPdfLineLimit(''); handlePdfExport(); }} className="w-full">
                            <FileText className="mr-2 h-4 w-4" /> Generate Full PDF
                        </Button>
                        <div>
                            <Label htmlFor="pdfLineLimit">Generate PDF up to line number (optional):</Label>
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
                            Generate Selected PDF
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="mt-4">
          <Input
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
                <TableHead className="w-[50px] cursor-pointer" onClick={() => handleSort('id')}>No. {renderSortArrow('id')}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>Date {renderSortArrow('date')}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('description')}>Description {renderSortArrow('description')}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('slipNo')}>Slip No. {renderSortArrow('slipNo')}</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('debit')}>Debit {renderSortArrow('debit')}</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('credit')}>Credit {renderSortArrow('credit')}</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('displayCode')}>Code {renderSortArrow('displayCode')}</TableHead>
                <TableHead className="w-[120px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedEntries.length > 0 ? (
                filteredAndSortedEntries.map((entry, index) => {
                  // Find the original transaction for editing/deleting, regardless of whether entry is direct or mirrored
                  const originalTransactionForActions = transactions.find(t => t.id === entry.id);
                  return (
                  <TableRow key={entry.id + (entry.isMirror ? '-mirror' : '')} className={`${entry.isMirror ? 'bg-muted/30 hover:bg-muted/50' : ''} transition-colors`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="max-w-xs truncate" title={entry.description}>{entry.description}</TableCell>
                    <TableCell>{entry.slipNo}</TableCell>
                    <TableCell className="text-right font-mono">{entry.debit > 0 ? entry.debit.toFixed(2) : '-'}</TableCell>
                    <TableCell className="text-right font-mono">{entry.credit > 0 ? entry.credit.toFixed(2) : '-'}</TableCell>
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
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
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

// Helper for Input component with icon
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
