import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Legislators — My Democracy',
  description: 'Look up your federal and state legislators by address. See voting records, sponsored bills, committee assignments, and news.',
};

export default function LegislatorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
