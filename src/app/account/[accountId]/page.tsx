// This file is a Server Component by default.
// DO NOT ADD "use client" HERE.

import AccountDetailsClient from './AccountDetailsClient';

// generateStaticParams is REQUIRED for dynamic routes when using "output: 'export'".
// It tells Next.js which instances of this dynamic route to pre-render at build time.
// For your application, where account IDs are dynamic and user-generated (stored in localStorage),
// you don't want to pre-render any specific account pages.
// Returning an empty array [] informs Next.js of this, satisfying the requirement
// for the function to exist without pre-rendering specific pages.
// Client-side navigation will then handle rendering these pages dynamically.
export async function generateStaticParams() {
  return [];
}

// This is the Server Component for the /account/[accountId] route.
// It receives route parameters (params) from Next.js.
export default function AccountPage({ params }: { params: { accountId: string } }) {
  // It then renders the AccountDetailsClient (a Client Component),
  // passing the accountId to it. The client component handles the actual
  // data fetching from localStorage and UI rendering.
  return <AccountDetailsClient accountId={params.accountId} />;
}
