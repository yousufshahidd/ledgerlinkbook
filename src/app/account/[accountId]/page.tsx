
// This file is a Server Component by default.
// DO NOT ADD "use client" HERE.

import AccountDetailsClient from './AccountDetailsClient';

// generateStaticParams is REQUIRED for dynamic routes when using output: 'export'.
// For a desktop app where account IDs are dynamic and user-generated,
// we return an empty array, indicating these pages will be client-side rendered
// after the initial app load. Next.js needs this function to exist, even if it's empty,
// to satisfy the static export requirements for dynamic segments.
export async function generateStaticParams() {
  return [];
}

// The Server Component default export.
// It receives params from Next.js and passes accountId to the client component.
export default function AccountPage({ params }: { params: { accountId: string } }) {
  // The actual rendering logic and client-side interactions are in AccountDetailsClient.
  return <AccountDetailsClient accountId={params.accountId} />;
}
