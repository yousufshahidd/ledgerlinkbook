
"use client";

import Link from 'next/link';
import React, { useState } from 'react';
import type { Account } from '@/lib/types';
import { useAccounting } from '@/context/AccountingContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowRight, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
  const { calculateAccountBalance, updateAccount, deleteAccount } = useAccounting();
  
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isUpdateConfirm1Open, setIsUpdateConfirm1Open] = useState(false);
  const [isUpdateConfirm2Open, setIsUpdateConfirm2Open] = useState(false);
  const [newAccountName, setNewAccountName] = useState(account.name);

  const [isDeleteConfirm1Open, setIsDeleteConfirm1Open] = useState(false);
  const [isDeleteConfirm2Open, setIsDeleteConfirm2Open] = useState(false);

  const { balance, type } = calculateAccountBalance(account.id);

  const handleUpdateAccount = async () => {
    if (newAccountName.trim() && newAccountName.trim() !== account.name) {
      await updateAccount(account.id, newAccountName.trim());
    }
    closeUpdateDialogs();
  };
  
  const handleDeleteAccount = async () => {
    await deleteAccount(account.id);
    closeDeleteDialogs();
  };

  const openUpdateDialog = () => {
    setNewAccountName(account.name); // Reset name on dialog open
    setIsUpdateDialogOpen(true);
  };

  const closeUpdateDialogs = () => {
    setIsUpdateDialogOpen(false);
    setIsUpdateConfirm1Open(false);
    setIsUpdateConfirm2Open(false);
  };
  
  const closeDeleteDialogs = () => {
    setIsDeleteConfirm1Open(false);
    setIsDeleteConfirm2Open(false);
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            {account.name}
          </CardTitle>
          <div className="flex space-x-1">
            <AlertDialog open={isUpdateConfirm1Open} onOpenChange={setIsUpdateConfirm1Open}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => { setNewAccountName(account.name); setIsUpdateConfirm1Open(true);}} aria-label="Edit account name">
                  <Pencil className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Update Account Name?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Current name: "{account.name}". Enter the new name below.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                  <Label htmlFor={`accountName-${account.id}`} className="sr-only">New Account Name</Label>
                  <Input 
                    id={`accountName-${account.id}`} 
                    value={newAccountName} 
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Enter new account name"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={closeUpdateDialogs}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => { setIsUpdateConfirm1Open(false); if (newAccountName.trim() && newAccountName.trim() !== account.name) setIsUpdateConfirm2Open(true);}}
                    disabled={!newAccountName.trim() || newAccountName.trim() === account.name}
                  >
                    Proceed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isUpdateConfirm2Open} onOpenChange={setIsUpdateConfirm2Open}>
              {/* This dialog is controlled programmatically */}
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Name Update</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to change the account name from "{account.name}" to "{newAccountName}"? This action is irreversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={closeUpdateDialogs}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUpdateAccount}>Confirm Update</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteConfirm1Open} onOpenChange={setIsDeleteConfirm1Open}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" aria-label="Delete account">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account "{account.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this account? This action cannot be undone and will also delete all associated transactions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={closeDeleteDialogs}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setIsDeleteConfirm1Open(false); setIsDeleteConfirm2Open(true);}} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Proceed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteConfirm2Open} onOpenChange={setIsDeleteConfirm2Open}>
                {/* This dialog is controlled programmatically */}
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion of "{account.name}"</AlertDialogTitle>
                  <AlertDialogDescription>
                    This is your final confirmation. Deleting account "{account.name}" and all its transactions is irreversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={closeDeleteDialogs}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Confirm Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <CardDescription>
          Created {formatDistanceToNow(new Date(account.createdAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Balance: <span className={`font-semibold ${type === 'Cr' ? 'text-destructive' : 'text-primary'}`}>
            {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {type !== 'Zero' ? type : ''}
          </span>
        </p>
      </CardContent>
      <CardFooter className="mt-auto pt-4">
        <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
          <Link href={`/account/${account.id}`}>
            Open Ledger <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
