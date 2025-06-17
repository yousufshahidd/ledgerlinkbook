"use client";

import { useState } from 'react';
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
import { useAccounting } from '@/context/AccountingContext';
import { PlusCircle } from 'lucide-react';

export function AddAccountDialog() {
  const [accountName, setAccountName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { addAccount } = useAccounting();

  const handleSubmit = async () => {
    if (accountName.trim()) {
      const newAccount = await addAccount(accountName.trim());
      if (newAccount) {
        setAccountName('');
        setIsOpen(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Enter the name for the new account. Account names must be unique.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="accountName" className="text-right">
              Name
            </Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="col-span-3"
              aria-label="Account Name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={!accountName.trim()}>Save Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
