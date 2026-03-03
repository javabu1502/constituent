import type { Metadata } from 'next';
import VoteClient from '@/components/vote/VoteClient';

export const metadata: Metadata = {
  title: 'Your Voting Guide | Register, Deadlines & Polling Places | My Democracy',
  description:
    'Everything you need to vote: check registration status, find your polling place, view election dates, and understand your state voting rules. All 50 states covered.',
  alternates: {
    canonical: 'https://www.mydemocracy.app/vote',
  },
  openGraph: {
    title: 'Your Voting Guide | My Democracy',
    description:
      'Check registration, find polling places, view election dates, and understand voting rules for all 50 states.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default function VotePage() {
  return <VoteClient />;
}
