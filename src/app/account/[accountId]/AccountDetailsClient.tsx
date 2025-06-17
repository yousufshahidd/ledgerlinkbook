
"use client";

import { useRouter } from 'next/navigation'; // useParams is no longer needed if accountId is passed as prop
import { useAccounting } from '@/context/AccountingContext';
import { LedgerTable } from '@/components/accounting/LedgerTable';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AccountDetailsClientProps {
  accountId: string;
}

export default function AccountDetailsClient({ accountId }: AccountDetailsClientProps) {
  // accountId is now received as a prop
  const { getAccountById, isLoading: isAccountingLoading } = useAccounting();
  const router = useRouter();

  const account = getAccountById(accountId);

  if (isAccountingLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading account data...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-10">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline text-destructive">Account Not Found</CardTitle>
            <CardDescription>The account you are looking for does not exist or could not be loaded.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="default">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
      <LedgerTable account={account} />
    </div>
  );
}
