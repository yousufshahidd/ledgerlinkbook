"use client";

import Link from 'next/link';
import type { Account } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen } from 'lucide-react';
import {formatDistanceToNow} from 'date-fns';

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-primary" />
          {account.name}
        </CardTitle>
        <CardDescription>
          Created {formatDistanceToNow(new Date(account.createdAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
          <Link href={`/account/${account.id}`}>
            Open Ledger <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
