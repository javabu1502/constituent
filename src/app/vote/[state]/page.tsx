import { redirect } from 'next/navigation';
import { US_STATES } from '@/lib/constants';

/**
 * /vote/[state] redirects to /states/[state] to capture SEO queries like
 * "how to vote in California" while keeping all state info on one page.
 */

export function generateStaticParams() {
  return US_STATES.map((s) => ({
    state: s.name.toLowerCase().replace(/\s+/g, '-'),
  }));
}

interface Props {
  params: Promise<{ state: string }>;
}

export default async function VoteStatePage({ params }: Props) {
  const { state } = await params;
  redirect(`/states/${state}`);
}
