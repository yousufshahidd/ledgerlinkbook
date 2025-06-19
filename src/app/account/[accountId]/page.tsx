"use client"; // This page now directly uses client-side hooks/components

import AccountDetailsClient from './AccountDetailsClient';
import { useParams } from 'next/navigation'; // Use hook for client components

// generateStaticParams is NO LONGER NEEDED when not using output: 'export'
// for standard Vercel deployments.

// This component will now effectively be the entry point for this route
// and will handle client-side rendering of account details.
export default function AccountPage() {
  const params = useParams();
  const accountId = params.accountId as string; // Access accountId from params

  // If accountId is not available yet (e.g., router not ready),
  // you might want to show a loader or return null.
  // However, AccountDetailsClient already has its own loading state.
  if (!accountId) {
    // Optionally, handle the case where accountId might not be immediately available
    // This is less common with useParams in App Router page components,
    // but good to be aware of.
    return null; // Or a loading spinner
  }

  return <AccountDetailsClient accountId={accountId} />;
}
