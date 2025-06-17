
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { Account, Transaction } from '@/lib/types';
import { useAccounting } from '@/context/AccountingContext';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface TransactionFormDialogProps {
  accountId: string;
  transactionToEdit?: Transaction;
  onFormSubmit?: () => void; // Callback after successful submission
}

const getDefaultDate = () => new Date().toISOString().split('T')[0];
const NONE_SELECT_VALUE_INTERNAL = "__NONE_ACCOUNT_ID__"; 

export function TransactionFormDialog({ accountId, transactionToEdit, onFormSubmit }: TransactionFormDialogProps) {
  const { accounts, addTransaction, updateTransaction, isSlipNoUnique: contextIsSlipNoUnique } = useAccounting();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(transactionToEdit?.date || getDefaultDate());
  const [description, setDescription] = useState(transactionToEdit?.description || '');
  const [slipNo, setSlipNo] = useState(transactionToEdit?.slipNo || '');
  const [amount, setAmount] = useState<string>(transactionToEdit ? (transactionToEdit.debit || transactionToEdit.credit).toString() : '');
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>(transactionToEdit ? (transactionToEdit.debit > 0 ? 'debit' : 'credit') : 'debit');
  const [codeAccountId, setCodeAccountId] = useState(transactionToEdit?.codeAccountId || '');
  
  const [slipNoError, setSlipNoError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setDate(transactionToEdit.date);
      setDescription(transactionToEdit.description);
      setSlipNo(transactionToEdit.slipNo);
      setAmount((transactionToEdit.debit || transactionToEdit.credit).toString());
      setTransactionType(transactionToEdit.debit > 0 ? 'debit' : 'credit');
      setCodeAccountId(transactionToEdit.codeAccountId || '');
    } else {
      setDate(getDefaultDate());
      setDescription('');
      setSlipNo('');
      setAmount('');
      setTransactionType('debit');
      setCodeAccountId('');
    }
    setSlipNoError(null);
  }, [transactionToEdit, isOpen]);

  const validateSlipNo = () => {
    if (slipNo.trim()) {
      const validationResult = contextIsSlipNoUnique(slipNo.trim(), transactionToEdit?.id);
      if (!validationResult.unique) {
        const errorMsg = `Slip No. "${slipNo.trim()}" is already in use. Original entry in account: "${validationResult.conflictingAccountName || 'N/A'}" (Date: ${validationResult.conflictingTransactionDate ? new Date(validationResult.conflictingTransactionDate).toLocaleDateString() : 'N/A'}, Desc: "${validationResult.conflictingTransactionDescription || 'N/A'}").`;
        setSlipNoError(errorMsg);
        return false;
      }
    }
    setSlipNoError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateSlipNo()) {
      // Toast notification for duplicate slip is handled by addTransaction/updateTransaction now
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ title: "Error", description: "Amount must be a positive number.", variant: "destructive" });
      return;
    }

    const transactionData = {
      accountId,
      date,
      description: description.trim(),
      slipNo: slipNo.trim(),
      debit: transactionType === 'debit' ? numericAmount : 0,
      credit: transactionType === 'credit' ? numericAmount : 0,
      codeAccountId: codeAccountId || undefined, 
    };

    let success = false;
    if (transactionToEdit) {
      const result = await updateTransaction({ ...transactionData, id: transactionToEdit.id, createdAt: transactionToEdit.createdAt });
      success = !!result;
    } else {
      const result = await addTransaction(transactionData);
      success = !!result;
    }

    if (success) {
      setIsOpen(false);
      onFormSubmit?.(); 
    }
  };
  
  const otherAccounts = accounts.filter(acc => acc.id !== accountId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {transactionToEdit ? (
          <Button variant="ghost" size="icon" aria-label="Edit Transaction">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="default">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{transactionToEdit ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
          <DialogDescription>
            {transactionToEdit ? 'Update the details of the transaction.' : 'Fill in the details for the new transaction.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="slipNo">Slip No.</Label>
            <Input id="slipNo" value={slipNo} onChange={e => setSlipNo(e.target.value)} onBlur={validateSlipNo} required />
            {slipNoError && <p className="text-sm text-destructive mt-1">{slipNoError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" step="0.01" min="0.01" required />
            </div>
            <div>
              <Label htmlFor="transactionType">Type</Label>
              <Select value={transactionType} onValueChange={(value: 'debit' | 'credit') => setTransactionType(value)}>
                <SelectTrigger id="transactionType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="codeAccountId">Code (Link to another account)</Label>
            <Select
              value={codeAccountId || NONE_SELECT_VALUE_INTERNAL}
              onValueChange={(value) => {
                setCodeAccountId(value === NONE_SELECT_VALUE_INTERNAL ? '' : value);
              }}
            >
              <SelectTrigger id="codeAccountId">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_SELECT_VALUE_INTERNAL}>None</SelectItem>
                {otherAccounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!!slipNoError || !description.trim() || !slipNo.trim() || !amount}>
              {transactionToEdit ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
