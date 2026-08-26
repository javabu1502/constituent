import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Team | My Democracy',
  description:
    'Meet the founder behind My Democracy — why it was built, the mission, and its commitment to non-partisan civic engagement.',
  alternates: {
    canonical: 'https://www.mydemocracy.app/team',
  },
};

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
      {children}
    </span>
  );
}

export default function TeamPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          The Team
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-10">
          My Democracy is an independent, founder-led project built to make
          contacting your elected officials simple, personal, and effective.
        </p>

        {/* Founder card */}
        <section className="mb-12">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-purple-600 dark:text-purple-300">
                JB
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Jared Busker
              </h2>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-3">
                Founder &amp; Builder
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                {/* PLACEHOLDER — edit this bio */}
                Jared is a builder and civic-tech advocate who created My
                Democracy after seeing how hard it is for everyday people to
                reach the officials who represent them. He designs, builds, and
                maintains the platform end to end, from the AI message assistant
                to the legislator data pipelines.
              </p>
            </div>
          </div>
        </section>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          {/* Why I built it */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <SectionIcon>
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </SectionIcon>
              Why I Built This
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 pl-10">
              {/* PLACEHOLDER — edit this narrative */}
              <p>
                Democracy works best when representatives actually hear from the
                people they serve. But for most of us, figuring out who
                represents us, finding the right contact information, and writing
                something that lands takes more time and confidence than we have.
              </p>
              <p>
                I built My Democracy to close that gap. The goal is simple: turn
                the intent to speak up into a message that gets sent in minutes,
                without watering down your voice into a form letter. Every
                message is yours — the tools just help you say it well.
              </p>
            </div>
          </section>

          {/* Background */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <SectionIcon>
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </SectionIcon>
              Background
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 pl-10">
              {/* PLACEHOLDER — edit with real background/credentials */}
              <p>
                With a background spanning software, product, and public-interest
                work, Jared has spent his career at the intersection of
                technology and civic life. My Democracy brings those threads
                together into one platform.
              </p>
              <p>
                The project is developed openly and iteratively, with new
                features shipped based directly on what users need to be heard.
              </p>
            </div>
          </section>

          {/* Non-partisan values */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <SectionIcon>
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </SectionIcon>
              Non-Partisan by Design
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                My Democracy does not take sides. It doesn&apos;t endorse
                candidates, parties, or positions. The platform serves people
                across the political spectrum equally, whatever issue moves them
                to reach out.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-gray-900 dark:text-white">Your words, your view</strong>: the AI helps you express what you believe, never what it thinks you should
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Privacy-forward</strong>: your data is stored securely, never sold, and deletion is available anytime
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Equal access</strong>: the same tools for every constituent, regardless of party or geography
                </li>
              </ul>
            </div>
          </section>

          {/* Contact / connect */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <SectionIcon>
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </SectionIcon>
              Get in Touch
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-300 pl-10">
              <p>
                Have feedback, a feature idea, or just want to say hello? I&apos;d
                love to hear from you.
              </p>
              <p>
                Email{' '}
                <a href="mailto:info@mydemocracy.app" className="text-purple-600 dark:text-purple-400 hover:underline">
                  info@mydemocracy.app
                </a>
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">My Democracy LLC</strong>, based in Reno, Nevada
              </p>
            </div>
          </section>

          {/* Support */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <SectionIcon>
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </SectionIcon>
              Support the Project
            </h2>
            <div className="pl-10">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                My Democracy is a passion project. If you find it useful,
                consider supporting its development.
              </p>
              <a
                href="https://buymeacoffee.com/mydemocracy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFDD00] hover:bg-[#e6c800] text-gray-900 font-semibold rounded-lg transition-colors shadow-sm"
              >
                <span className="text-xl">☕</span>
                Support My Democracy
              </a>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
