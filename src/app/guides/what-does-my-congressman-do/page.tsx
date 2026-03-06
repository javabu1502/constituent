import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'What Does My Elected Official Actually Do? | My Democracy',
  description: 'Learn what members of Congress do day-to-day: legislating, committee work, constituent services, oversight, and how they spend their time in Washington and at home.',
  keywords: ['what does a congressman do', 'congress responsibilities', 'representative duties', 'congressional committees', 'constituent services', 'how congress works'],
  openGraph: {
    title: 'What Does My Elected Official Actually Do? | My Democracy',
    description: 'Learn what members of Congress do day-to-day and how their work affects you.',
    type: 'article',
  },
};

export default function WhatDoesCongressmanDoPage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'What Does My Elected Official Actually Do?', href: '/guides/what-does-my-congressman-do' }]} />
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/guides" className="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Guides
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          What Does My Elected Official Actually Do?
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Members of Congress wear many hats — from writing laws to helping constituents navigate federal agencies. Understanding what your official does helps you know when and how to engage with them effectively.
          </p>

          {/* Legislating */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Writing and Voting on Laws
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                The primary constitutional duty of Congress is legislation. Members introduce bills, debate them, amend them in committee, and cast votes on the floor. Each Congress (a two-year term) typically sees thousands of bills introduced, though only a small fraction become law.
              </p>
              <p>
                You can see how your officials vote on bills using the <Link href="/vote" className="text-purple-600 dark:text-purple-400 hover:underline">My Democracy voting records page</Link> or on <a href="https://www.congress.gov/roll-call-votes" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a>. Learn more in our guide to <Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">how a bill becomes law</Link>.
              </p>
            </div>
          </section>

          {/* Committee Work */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              Committee Work
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Most of the detailed legislative work happens in committees and subcommittees. Each member of Congress serves on one or more committees that specialize in areas like Armed Services, Agriculture, Judiciary, or Appropriations. The House has standing committees defined in its rules, while the Senate has its own set.
              </p>
              <p>
                Committees hold hearings to gather expert testimony, mark up (revise) bills, and decide which legislation advances to the full chamber. Committee chairs have significant power over what bills get a hearing. You can find your official&apos;s committee assignments on their <Link href="/legislators" className="text-purple-600 dark:text-purple-400 hover:underline">profile page</Link>.
              </p>
            </div>
          </section>

          {/* Constituent Services */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              Constituent Services (Casework)
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Every congressional office has staff dedicated to helping constituents with problems involving federal agencies. This is called &quot;casework.&quot; Common requests include help with Social Security benefits, Medicare issues, VA claims, passport processing, IRS disputes, and immigration cases.
              </p>
              <p>
                This service is free and available to everyone in the district or state, regardless of party. Learn more in our <Link href="/guides/constituent-services" className="text-purple-600 dark:text-purple-400 hover:underline">guide to requesting help from your officials</Link>.
              </p>
            </div>
          </section>

          {/* Oversight */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </span>
              Oversight of the Executive Branch
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Congress has a constitutional responsibility to oversee the executive branch. This includes holding hearings to examine how agencies implement laws, investigating waste and misconduct, confirming presidential nominees (Senate), and controlling the federal budget through the appropriations process.
              </p>
              <p>
                The Senate specifically has the power to confirm or reject presidential appointments to the federal judiciary, Cabinet positions, and other senior roles through its &quot;advice and consent&quot; authority under Article II of the Constitution.
              </p>
            </div>
          </section>

          {/* District Work */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
              Back Home in the District
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                When Congress is not in session, members return to their districts and states. During these &quot;district work periods,&quot; they hold town halls, meet with local organizations, visit businesses and schools, and attend community events. This is often the best time to meet your official in person.
              </p>
              <p>
                You can find out when your official is home by checking their official website or social media. See our guide to <Link href="/guides/how-to-attend-a-town-hall" className="text-purple-600 dark:text-purple-400 hover:underline">attending a town hall</Link> for tips on making the most of face-to-face interactions.
              </p>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">How to Contact Your Elected Officials</Link></li>
              <li><Link href="/guides/how-congress-votes" className="text-purple-600 dark:text-purple-400 hover:underline">How Congress Votes and What It Means</Link></li>
              <li><Link href="/guides/constituent-services" className="text-purple-600 dark:text-purple-400 hover:underline">How to Request Help from Your Officials</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">See what your official is working on</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Look up their committee assignments, recent votes, and contact information.</p>
          <Link href="/legislators" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            Find Your Officials
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link href="/guides" className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            All Guides
          </Link>
        </div>
      </div>
    </div>
  );
}
