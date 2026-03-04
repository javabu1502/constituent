import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Understanding State vs. Federal Power | My Democracy',
  description: 'Learn how federalism divides power between state and federal government. Understand the 10th Amendment, preemption, concurrent powers, and what it means for you.',
  keywords: ['federalism', 'state vs federal power', '10th amendment', 'preemption', 'concurrent powers', 'states rights', 'federal government', 'constitution'],
  openGraph: {
    title: 'Understanding State vs. Federal Power | My Democracy',
    description: 'Learn how federalism divides power between state and federal government. Understand the 10th Amendment, preemption, concurrent powers, and what it means for you.',
    type: 'article',
  },
};

export default function StateVsFederalPowerGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'State vs. Federal Power', href: '/guides/state-vs-federal-power' }]} />
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
          Understanding State vs. Federal Power
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            The United States operates under a system of <strong className="text-gray-900 dark:text-white">federalism</strong>, meaning governmental power is divided between a national government and state governments. This division shapes nearly every policy that affects your daily life, from the speed limit on your street to the taxes you pay. Understanding how power is shared and where conflicts arise is essential for any engaged citizen.
          </p>

          {/* What Is Federalism? */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              What Is Federalism?
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Federalism is the constitutional principle that distributes governing authority between the national (federal) government and the individual state governments. Rather than concentrating all power in one place, the framers of the Constitution designed a system where both levels of government operate independently within their own spheres while also sharing certain responsibilities.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                The foundation of this system is the <strong className="text-gray-900 dark:text-white">U.S. Constitution</strong>. Article I grants specific powers to Congress. Article II defines the executive branch. And critically, the <strong className="text-gray-900 dark:text-white">Tenth Amendment</strong> states: &quot;The powers not delegated to the United States by the Constitution, nor prohibited by it to the States, are reserved to the States respectively, or to the people.&quot; This amendment is the cornerstone of state sovereignty within the federal system.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                In practice, federalism means that the federal government and state governments each have their own constitutions, legislatures, executives, and court systems. You live under the authority of both simultaneously, and which level of government has the final say depends on the issue at hand.
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                <a href="https://constitution.congress.gov/browse/amendment-10/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Read the Tenth Amendment at constitution.congress.gov</a>
              </p>
            </div>
          </section>

          {/* Powers Reserved to the Federal Government */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </span>
              Powers Reserved to the Federal Government
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                The Constitution grants certain <strong className="text-gray-900 dark:text-white">enumerated powers</strong> exclusively to the federal government. These are areas where only Congress and the federal executive can act, and states cannot legislate independently.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Key federal powers outlined in <a href="https://constitution.congress.gov/browse/article-1/section-8/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Article I, Section 8 of the Constitution</a> include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li><strong className="text-gray-900 dark:text-white">Declaring war and maintaining armed forces</strong> -- Only Congress can declare war, and the federal government commands the military.</li>
                <li><strong className="text-gray-900 dark:text-white">Regulating interstate and foreign commerce</strong> -- The Commerce Clause gives Congress authority over trade that crosses state lines or national borders.</li>
                <li><strong className="text-gray-900 dark:text-white">Coining money and regulating its value</strong> -- States cannot print their own currency.</li>
                <li><strong className="text-gray-900 dark:text-white">Establishing immigration and naturalization rules</strong> -- Federal law governs who may enter the country and become a citizen.</li>
                <li><strong className="text-gray-900 dark:text-white">Making treaties with foreign nations</strong> -- Only the President, with Senate approval, can enter into treaties.</li>
                <li><strong className="text-gray-900 dark:text-white">Establishing post offices</strong> -- The postal system is a federal function.</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300">
                Beyond these enumerated powers, the <strong className="text-gray-900 dark:text-white">Necessary and Proper Clause</strong> (also in Article I, Section 8) grants Congress the authority to make laws needed to carry out its enumerated powers. This clause, sometimes called the &quot;elastic clause,&quot; has been the basis for significant expansions of federal authority over time.
              </p>
            </div>
          </section>

          {/* Powers Reserved to the States */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Powers Reserved to the States
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Under the Tenth Amendment, any power not specifically granted to the federal government and not prohibited to the states remains with the states or the people. These <strong className="text-gray-900 dark:text-white">reserved powers</strong> are broad and cover many of the government functions that most directly affect daily life.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Areas where states hold primary authority include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li><strong className="text-gray-900 dark:text-white">Education</strong> -- States establish and fund public school systems, set curriculum standards, and govern higher education institutions. There is no federal right to education in the Constitution.</li>
                <li><strong className="text-gray-900 dark:text-white">Law enforcement and criminal law</strong> -- Most criminal law is state law. State and local police handle the vast majority of law enforcement. Each state defines its own criminal code, penalties, and court procedures.</li>
                <li><strong className="text-gray-900 dark:text-white">Elections administration</strong> -- While the Constitution sets some baseline requirements, states run their own elections, including setting voter registration rules, designing ballots, and managing polling places.</li>
                <li><strong className="text-gray-900 dark:text-white">Family law</strong> -- Marriage, divorce, child custody, and adoption are governed by state law.</li>
                <li><strong className="text-gray-900 dark:text-white">Land use and zoning</strong> -- States and their local governments control how land can be used, including housing, commercial development, and environmental protections at the local level.</li>
                <li><strong className="text-gray-900 dark:text-white">Licensing and regulation</strong> -- Professional licenses for doctors, lawyers, teachers, and other occupations are issued by states, each with its own requirements.</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300">
                States also have <strong className="text-gray-900 dark:text-white">concurrent powers</strong> -- authorities shared with the federal government. Both levels of government can levy taxes, build roads, establish courts, and borrow money. When both act in the same area, questions of conflict and preemption arise.
              </p>
            </div>
          </section>

          {/* When State and Federal Law Conflict */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              When State and Federal Law Conflict
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Because state and federal governments sometimes legislate in the same areas, conflicts can arise. The Constitution provides a clear rule for resolving these conflicts: the <strong className="text-gray-900 dark:text-white">Supremacy Clause</strong> in <a href="https://constitution.congress.gov/browse/article-6/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Article VI</a> establishes that the Constitution and federal laws made under it are the &quot;supreme Law of the Land.&quot; When a valid federal law directly conflicts with a state law, the federal law prevails.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                This principle is known as <strong className="text-gray-900 dark:text-white">preemption</strong>. There are several ways preemption works:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li><strong className="text-gray-900 dark:text-white">Express preemption</strong> -- Congress explicitly states in the text of a law that it overrides state law on that subject.</li>
                <li><strong className="text-gray-900 dark:text-white">Implied preemption</strong> -- Even without explicit language, federal law may preempt state law if Congress has so thoroughly regulated an area that it is clear the federal government intended to occupy the entire field (known as &quot;field preemption&quot;).</li>
                <li><strong className="text-gray-900 dark:text-white">Conflict preemption</strong> -- A state law is preempted if it is impossible to comply with both the state and federal law simultaneously, or if the state law stands as an obstacle to the objectives of the federal law.</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300">
                However, preemption is not always straightforward. States can sometimes set <strong className="text-gray-900 dark:text-white">stricter standards</strong> than federal law. For example, states may enact environmental regulations that exceed federal minimums, as long as they do not directly contradict federal requirements. Whether a state law is preempted often depends on how the federal law is written and how courts interpret it.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Disputes over preemption are frequently settled by the federal courts, including the <strong className="text-gray-900 dark:text-white">Supreme Court</strong>, which has the final say on questions of constitutional interpretation.
              </p>
            </div>
          </section>

          {/* Why This Matters for You */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              Why This Matters for You
            </h2>
            <div className="pl-10 space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Understanding the division of power between state and federal government is practical, not just theoretical. It determines <strong className="text-gray-900 dark:text-white">who to contact</strong> when you want to change a policy and <strong className="text-gray-900 dark:text-white">which elections matter most</strong> for the issues you care about.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                If you want to change how schools operate in your community, your state legislature and local school board are the places to start -- not Congress. If you are concerned about immigration policy, that is a federal issue. If you care about criminal justice reform, most criminal law is state law, so your state legislators and governor have the most direct authority.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                This also means that <strong className="text-gray-900 dark:text-white">state and local elections</strong> have an enormous impact on your daily life. Governors, state legislators, attorneys general, and local officials make decisions about education funding, policing, infrastructure, business regulations, and much more. Voter turnout in state and local elections is typically much lower than in presidential elections, which means your vote and your voice carry even more weight.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                When you are advocating for a policy change, the first step is always to ask: <strong className="text-gray-900 dark:text-white">which level of government has authority over this issue?</strong> Directing your energy to the right officials makes your advocacy more effective. Use our <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline">contact tool</Link> to find both your federal and state representatives.
              </p>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/how-a-bill-becomes-law" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How a Bill Becomes Law
                </Link>
              </li>
              <li>
                <Link href="/guides/how-the-supreme-court-works" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How the Supreme Court Works
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-contact-your-state-legislators" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your State Legislators
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Know who represents you at every level
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Find your federal and state representatives and make your voice heard where it counts.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Contact Your Reps
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
