import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Civic Engagement for New Citizens | My Democracy',
  description: 'A guide for newly naturalized U.S. citizens on voting, jury duty, community involvement, and the rights and responsibilities that come with citizenship.',
  keywords: ['new citizen', 'naturalization', 'civic engagement', 'voter registration', 'jury duty', 'citizenship rights', 'new Americans'],
  openGraph: {
    title: 'Civic Engagement for New Citizens | My Democracy',
    description: 'A guide for newly naturalized U.S. citizens on voting, jury duty, community involvement, and the rights and responsibilities that come with citizenship.',
    type: 'article',
  },
};

export default function CivicEngagementNewCitizensGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Civic Engagement for New Citizens', href: '/guides/civic-engagement-new-citizens' }]} />
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Guides
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Civic Engagement for New Citizens
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Congratulations on becoming a United States citizen. Naturalization gives you the full rights and responsibilities of citizenship, including the right to vote, serve on a jury, and run for many elected offices. This guide walks you through the key ways you can participate in American civic life and the resources available to help you get started.
          </p>

          {/* Your Rights as a New Citizen */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              Your Rights as a New Citizen
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                As a naturalized citizen, you have the same rights as citizens born in the United States, with one exception: only natural-born citizens are eligible to serve as President or Vice President. In all other respects, your citizenship is equal.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Key rights you now hold:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">The right to vote</strong> -You can vote in federal, state, and local elections. This is one of the most fundamental ways to shape the government that represents you.</li>
                <li><strong className="text-gray-900 dark:text-white">The right to run for elected office</strong> -Naturalized citizens are eligible to run for most elected positions, including U.S. Senate, U.S. House of Representatives, governor, mayor, school board, and many more.</li>
                <li><strong className="text-gray-900 dark:text-white">The right to a U.S. passport</strong> -You can apply for a U.S. passport and receive full consular protection when traveling abroad.</li>
                <li><strong className="text-gray-900 dark:text-white">The right to petition the government</strong> -You can contact your elected officials, attend public hearings, and advocate for policy changes.</li>
                <li><strong className="text-gray-900 dark:text-white">Protection from deportation</strong> -As a citizen, you cannot be deported. Your citizenship is permanent unless you voluntarily renounce it or it is revoked through a federal court proceeding in rare cases involving fraud during the naturalization process.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Key responsibilities:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Obeying federal, state, and local laws</li>
                <li>Paying federal, state, and local taxes</li>
                <li>Serving on a jury when called</li>
                <li>Registering with the Selective Service if you are a male between 18 and 25</li>
              </ul>
              <p>
                For a full overview of citizen rights and responsibilities, visit the <a href="https://www.uscis.gov/citizenship/learn-about-citizenship/citizenship-and-naturalization" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">U.S. Citizenship and Immigration Services (USCIS)</a> website.
              </p>
            </div>
          </section>

          {/* Registering to Vote */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </span>
              Registering to Vote
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Registering to vote is typically the first civic step new citizens take. You are eligible to register as soon as you take the Oath of Allegiance. Some naturalization ceremonies even offer on-site voter registration.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">How to register:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Online</strong> -Many states allow online voter registration. Visit <a href="https://vote.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">vote.gov</a> to find your state&apos;s registration system and check whether online registration is available where you live.</li>
                <li><strong className="text-gray-900 dark:text-white">By mail</strong> -You can download and print a National Voter Registration Form from <a href="https://vote.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">vote.gov</a>, fill it out, and mail it to your state election office.</li>
                <li><strong className="text-gray-900 dark:text-white">In person</strong> -You can register at your local election office, many DMV offices, and other government agencies. Some states also allow same-day registration at polling places.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">What you&apos;ll need:</strong> Your naturalization certificate number or Certificate of Citizenship number, your current address, and a state-issued ID or the last four digits of your Social Security number. Requirements vary by state.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Registration deadlines:</strong> Most states require you to register a certain number of days before an election. Check your state&apos;s deadline well in advance to ensure you can vote. For a detailed walkthrough, see our <Link href="/guides/how-to-register-to-vote" className="text-purple-600 dark:text-purple-400 hover:underline">guide to voter registration</Link>.
              </p>
            </div>
          </section>

          {/* Understanding Jury Duty */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </span>
              Understanding Jury Duty
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Jury service is both a right and a responsibility of citizenship. Only U.S. citizens can serve on juries, and the jury system depends on having a representative cross-section of the community. As a new citizen, you may be called for jury duty in either federal or state court.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">How jury selection works:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Courts draw potential jurors from lists of registered voters, licensed drivers, and other public records. Once you register to vote or obtain a state ID, you may be called.</li>
                <li>If summoned, you&apos;ll report to the courthouse on a specified date. Most jury service involves a brief screening process called voir dire, where attorneys for both sides ask questions to select jurors.</li>
                <li>Many people who are summoned are not ultimately selected to serve on a trial. You may be dismissed after the screening process.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">What to expect:</strong> Jury service can last from one day to several weeks, depending on the case. Federal law and most state laws require employers to allow time off for jury duty, though compensation policies vary. If serving would create a genuine hardship, you can request a postponement or exemption from the court.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Why it matters:</strong> The right to a trial by a jury of one&apos;s peers is a cornerstone of the American legal system. Serving on a jury gives you a direct role in ensuring justice is applied fairly in your community.
              </p>
            </div>
          </section>

          {/* Getting Involved in Your Community */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              Getting Involved in Your Community
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Civic engagement goes well beyond voting. There are many ways to participate in your community and make your voice heard at the local, state, and federal levels.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Ways to get involved:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Contact your elected officials</strong> -You have representatives at the federal, state, and local levels. They work for you, and their offices are set up to hear from constituents. Use <Link href="/guides/who-are-my-representatives" className="text-purple-600 dark:text-purple-400 hover:underline">our guide</Link> to find out who represents you.</li>
                <li><strong className="text-gray-900 dark:text-white">Attend public meetings</strong> -City council meetings, school board meetings, and town halls are open to the public. Attending gives you insight into how local decisions are made and a chance to speak during public comment periods.</li>
                <li><strong className="text-gray-900 dark:text-white">Join local boards and commissions</strong> -Many municipalities have volunteer boards that advise on planning, parks, libraries, public safety, and other issues. These positions are open to residents and are a great way to contribute your skills and perspective.</li>
                <li><strong className="text-gray-900 dark:text-white">Volunteer for campaigns or causes</strong> -Political campaigns, voter registration drives, and community organizations always need volunteers. This is a way to meet neighbors and contribute to causes you care about.</li>
                <li><strong className="text-gray-900 dark:text-white">Run for office</strong> -Naturalized citizens are eligible for nearly all elected offices. Many local positions -school board, city council, county commission -are part-time roles that don&apos;t require previous political experience. See our <Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">guide to local politics</Link> for more information.</li>
              </ul>
            </div>
          </section>

          {/* Resources for New Citizens */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              Resources for New Citizens
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                <strong className="text-gray-900 dark:text-white">Official government resources:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><a href="https://www.uscis.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">USCIS (uscis.gov)</a> -U.S. Citizenship and Immigration Services provides information on citizenship rights and responsibilities, replacement naturalization certificates, and applying for U.S. passports after naturalization.</li>
                <li><a href="https://vote.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">vote.gov</a> -The federal government&apos;s voter registration portal. Provides links to each state&apos;s registration system and information about registration deadlines and requirements.</li>
                <li><a href="https://www.usa.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">USA.gov</a> -A general portal for federal government services and information, including guides on government structure, finding elected officials, and understanding federal agencies.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Tips for getting started:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Keep your naturalization certificate in a safe place. You may need it for voter registration, passport applications, and other processes.</li>
                <li>Register to vote as soon as possible, even if there isn&apos;t an election coming up soon. Being registered means you&apos;ll be ready when the time comes.</li>
                <li>Learn who your officials are at every level -federal, state, and local. You can use <Link href="/guides/who-are-my-representatives" className="text-purple-600 dark:text-purple-400 hover:underline">My Democracy&apos;s tools</Link> to find them by your address.</li>
                <li>Don&apos;t feel pressured to have opinions on every issue immediately. Take time to learn about the issues that affect your community and form your own views.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/how-to-register-to-vote" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Register to Vote
                </Link>
              </li>
              <li>
                <Link href="/guides/who-are-my-representatives" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Who Are My Elected Officials?
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Get Involved in Local Politics
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to make your voice heard?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Find your officials and start engaging with the people who represent you in government.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Write to Your Officials
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Back to Guides */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Guides
          </Link>
        </div>
      </div>
    </div>
  );
}
