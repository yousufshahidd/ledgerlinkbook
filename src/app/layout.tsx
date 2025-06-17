import type { Metadata } from 'next';
import Link from 'next/link';
import { Home } from 'lucide-react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from '@/context/AppProviders';

export const metadata: Metadata = {
  title: 'Ledger Local',
  description: 'Personal Desktop Accounting Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AppProviders>
          <header className="bg-primary text-primary-foreground shadow-md">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <Link href="/" className="text-xl font-bold font-headline flex items-center gap-2 hover:opacity-90 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-marked"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><polyline points="10 2 10 10 13 7 16 10 16 2"/></svg>
                Ledger Local
              </Link>
              <nav>
                <Link href="/" className="hover:text-accent transition-colors p-2 rounded-md hover:bg-primary-foreground/10">
                  <Home className="inline-block h-5 w-5" />
                  <span className="sr-only">Dashboard</span>
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
