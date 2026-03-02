import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { HomeTrends } from '@/components/trends/HomeTrends';
import { US_STATES } from '@/lib/constants';
import { StatePicker } from '@/components/ui/StatePicker';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'My Democracy',
  url: 'https://www.mydemocracy.app',
  logo: 'https://www.mydemocracy.app/icon.svg',
  description:
    'Find and contact your federal and state representatives. Track legislation, voting records, and take civic action.',
  sameAs: [],
};

const faqItems = [
  {
    question: 'How do I contact my representative?',
    answer:
      'Enter your home address on our Contact page and we\'ll find your federal and state representatives. Then choose an issue, and our AI will draft a personalized message you can send by email, fax, or use as a script for a phone call.',
  },
  {
    question: 'Is My Democracy free?',
    answer:
      'Yes, My Democracy is completely free to use. No account is required to look up your representatives and send them a message.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-purple-50 via-purple-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Your voice matters.
            <br />
            <span className="text-purple-600 dark:text-purple-400">Make it heard.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Your all-in-one civic engagement hub. Know your representatives,
            track legislation, and take action.
          </p>
          <Link href="/contact">
            <Button size="lg" className="text-lg px-8 py-4">
              Contact Your Reps
            </Button>
          </Link>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/dashboard" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
              Go to Dashboard
            </Link>
          </p>
        </div>
      </section>

      {/* Trending Issues + Social Proof */}
      <HomeTrends />

      {/* Explore Your State */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Explore Your State</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Voting rules, election dates, and representatives for every state.
          </p>
          <StatePicker />
          {/* Hidden links for SEO crawlers */}
          <div className="sr-only">
            {US_STATES.map((s) => (
              <a key={s.code} href={`/states/${s.name.toLowerCase().replace(/\s+/g, '-')}`}>
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Contact your representatives in three simple steps
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Enter your address
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                We find your federal and state representatives at every level of government.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Choose your issue
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Pick what matters to you and our AI drafts a personalized message on your behalf.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Send your message
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Deliver it directly via email or fax — all in a few minutes.
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/contact">
              <Button size="lg" className="text-lg px-8 py-4">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ + Final CTA */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-600"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {item.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 px-4 bg-purple-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to be heard?
          </h2>
          <p className="text-purple-100 mb-8 text-lg">
            Your representatives work for you. Let them know what matters.
          </p>
          <Link href="/contact">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-purple-600 hover:bg-purple-50 border-white text-lg px-8"
            >
              Contact Your Reps
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
