import type { Metadata } from 'next';
import Link from 'next/link';
import { FindRepresentativesClient } from '@/components/representatives/FindRepresentativesClient';

export const metadata: Metadata = {
  title: 'Find My Representatives | My Democracy',
  description:
    'Enter your address to find every elected official who represents you: your U.S. senators and House member, your state legislators, and your county, city and school board officials.',
  alternates: {
    canonical: 'https://www.mydemocracy.app/representatives',
  },
  openGraph: {
    title: 'Find My Representatives | My Democracy',
    description:
      'Enter your address to see everyone who represents you, from Congress down to your county and school board.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

/**
 * The lookup had no page of its own: the only way to see who represents you
 * was to start writing a letter at /contact, and the one page that answers
 * the question by name (/guides/who-are-my-representatives) is an explainer
 * with no tool behind it.
 */
export default function RepresentativesPage() {
  return (
    <>
      <FindRepresentativesClient />
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">How this works</h2>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <p>
            Your address is matched against the Census geocoder to work out which districts you live in. Those districts
            decide who represents you: one congressional district, a state senate and state house district, and the
            county, city and school district boundaries around your home.
          </p>
          <p>
            A ZIP code alone is not enough. ZIP codes cross district lines, so two neighbours on the same street can have
            different representatives. That is why the full street address is needed.
          </p>
          <p>
            Want to understand the offices themselves?{' '}
            <Link href="/guides/who-are-my-representatives" className="text-purple-600 dark:text-purple-400 hover:underline">
              Read the guide
            </Link>
            , or go straight to{' '}
            <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline">
              writing to them
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
