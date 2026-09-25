import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

// Bio facts + photo supplied by Jared 2026-09-25. Flip stays here so the page
// can be pulled instantly if needed.
const TEAM_PAGE_LIVE = true;

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
  if (!TEAM_PAGE_LIVE) notFound();
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
            <Image
              src="/team/jared-busker.jpg"
              alt="Jared Busker"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover flex-shrink-0"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Jared Busker
              </h2>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                Founder &amp; Builder
              </p>
              <a
                href="https://www.linkedin.com/in/jared-busker-0720b075/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-3 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                </svg>
                LinkedIn
              </a>
              <p className="text-gray-600 dark:text-gray-300">
                Jared has spent his career as a child advocate, with years of
                work at the state and national levels, inside a state
                legislature, and in Congress. Much of that work was helping
                constituents learn to speak for themselves and their
                communities. My Democracy turns that work into a platform
                anyone can use.
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
              <p>
                I spent years recruiting constituents into advocacy campaigns,
                and I watched the same thing happen every time. People cared
                about the issue and genuinely wanted to help, then stalled at
                the blank page. The system is hard to navigate, and nobody
                tells you what a useful message to a lawmaker looks like.
                Meanwhile, elected officials and their staff were blunt about
                the other side of the problem: form messages don&apos;t carry
                the same weight as a constituent&apos;s own story.
              </p>
              <p>
                AI removes that barrier to entry. On My Democracy, an advocacy
                organization writes the policy ask, and each constituent adds
                their own experience in their own words. The office receives a
                high-quality personal message from a real constituent, with the
                ask intact.
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
              <p>
                Before My Democracy, Jared worked in child and family policy at
                the state and national levels, including inside a state
                legislature and in Congress. He has seen constituent advocacy
                from both sides: as staff inside government, and as an advocate
                recruiting people into campaigns.
              </p>
              <p>
                He designs and builds the platform end to end, and ships new
                features based directly on what advocates and organizations
                need to be heard.
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
