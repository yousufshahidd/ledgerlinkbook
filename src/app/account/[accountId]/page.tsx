
// This file is now a Server Component
import AccountDetailsClient from './AccountDetailsClient';

// When using output: 'export', generateStaticParams is required for dynamic routes.
// For a desktop app where account IDs are dynamic and user-generated,
// we return an empty array, indicating these pages will be client-side rendered.
export async function generateStaticParams() {
  return [];
}

// The Server Component default export.
// It receives params from Next.js and passes accountId to the client component.
export default function AccountPage({ params }: { params: { accountId: string } }) {
  return <AccountDetailsClient accountId={params.accountId} />;
}
