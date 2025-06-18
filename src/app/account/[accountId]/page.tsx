
// This file is now a Server Component
import AccountDetailsClient from './AccountDetailsClient';

export async function generateStaticParams() {
  // For an app with dynamic, user-created data, especially when using
  // output: 'export', we don't pre-render specific account pages at build time.
  // Return an empty array. Routes will be handled client-side
  // or on-demand if the hosting platform supports it (for Vercel, client-side is key here).
  return [];
}

// The Server Component default export.
// It receives params from Next.js and passes accountId to the client component.
export default function AccountPage({ params }: { params: { accountId: string } }) {
  return <AccountDetailsClient accountId={params.accountId} />;
}
