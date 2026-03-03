import type { Metadata } from 'next';
import LegislatorsClient from '@/components/legislators/LegislatorsClient';

export const metadata: Metadata = {
  title: 'State Legislators & Local Officials | My Democracy',
  description:
    'Browse state legislators and local officials by state. View their recent bills, votes, and news. Find your mayor, city council, and county officials.',
  alternates: {
    canonical: 'https://www.mydemocracy.app/legislators',
  },
  openGraph: {
    title: 'State Legislators & Local Officials | My Democracy',
    description:
      'Browse state legislators and local officials by state. View their recent bills, votes, and news.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default function LegislatorsPage() {
  return <LegislatorsClient />;
}
