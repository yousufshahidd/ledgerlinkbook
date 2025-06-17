"use client";

import { useAccounting } from '@/context/AccountingContext';
import { AccountCard } from '@/components/accounting/AccountCard';
import { AddAccountDialog } from '@/components/accounting/AddAccountDialog';
import { BackupRestoreControls } from '@/components/accounting/BackupRestoreControls';
import { Skeleton } from '@/components/ui/skeleton';
import { BookDashed } from 'lucide-react';

export default function DashboardPage() {
  const { accounts, isLoading } = useAccounting();

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline text-primary">Accounts Dashboard</h1>
        <AddAccountDialog />
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
          <BookDashed className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">No Accounts Yet</h2>
          <p className="text-muted-foreground">Get started by adding your first account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {accounts.map(account => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
      <BackupRestoreControls />
    </div>
  );
}
