import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Voter Information & Registration Guide | My Democracy',
  description:
    'Check your voter registration, find your polling place, see your state\'s voting rules, and get 2026 election dates. Register to vote, learn about early voting, absentee ballots, and voter ID requirements.',
  keywords: [
    'voter registration',
    'polling place',
    'voting guide',
    '2026 election',
    'voter ID',
    'early voting',
    'absentee ballot',
    'election dates',
  ],
  openGraph: {
    title: 'Voter Information & Registration Guide | My Democracy',
    description:
      'Check your voter registration, find your polling place, see your state\'s voting rules, and get 2026 election dates.',
    type: 'website',
  },
};

export default function VoteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
