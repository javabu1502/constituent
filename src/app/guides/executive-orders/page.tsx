import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'What Are Executive Orders and How Do They Work? | My Democracy',
  description: 'Understand what executive orders are, their legal basis, the limits on presidential executive power, how they can be challenged, and notable examples throughout history.',
  keywords: ['executive orders', 'presidential power', 'executive action', 'federal register', 'separation of powers', 'constitutional authority'],
  openGraph: {
    title: 'What Are Executive Orders and How Do They Work? | My Democracy',
    description: 'Understand what executive orders are, their legal basis, the limits on presidential executive power, how they can be challenged, and notable examples throughout history.',
    type: 'article',
  },
};

export default function ExecutiveOrdersGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Executive Orders', href: '/guides/executive-orders' }]} />
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
          What Are Executive Orders and How Do They Work?
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Executive orders are directives issued by the President of the United States that manage operations of the federal government. They carry the force of law but differ from legislation passed by Congress in important ways. Understanding executive orders helps you follow presidential action, know its limits, and recognize when and how they can be challenged.
          </p>

          {/* What Is an Executive Order? */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              What Is an Executive Order?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                An executive order is a signed, written directive from the President to the executive branch of the federal government. It instructs federal agencies and officials on how to carry out their duties, allocate resources, or implement existing law.
              </p>
              <p>
                Executive orders are numbered sequentially and published in the <a href="https://www.federalregister.gov/presidential-documents/executive-orders" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Federal Register</a>, the official daily journal of the U.S. government. Once published, they become part of the public record and are binding on federal agencies.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Key characteristics of executive orders:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">They direct the executive branch</strong>: Executive orders apply to federal agencies, departments, and employees. They do not directly create laws that bind private citizens or businesses, though they can have significant indirect effects.</li>
                <li><strong className="text-gray-900 dark:text-white">They do not require Congressional approval</strong>: The President can issue an executive order unilaterally. Congress does not vote on them.</li>
                <li><strong className="text-gray-900 dark:text-white">They can be revoked</strong>: A sitting President can revoke or amend any executive order issued by a previous President. This means executive orders are less durable than legislation.</li>
                <li><strong className="text-gray-900 dark:text-white">They must be grounded in legal authority</strong>: An executive order must cite either a constitutional provision or a statute that grants the President authority to act.</li>
              </ul>
              <p>
                Executive orders are one of several types of presidential directives. Others include presidential memoranda, proclamations, and national security directives. Executive orders are the most formal of these and the most widely tracked.
              </p>
            </div>
          </section>

          {/* The Legal Basis for Executive Orders */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </span>
              The Legal Basis for Executive Orders
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                The U.S. Constitution does not explicitly mention executive orders. The President&apos;s authority to issue them is derived from two sources:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Article II of the Constitution</strong>: This article vests executive power in the President and requires the President to &quot;take care that the laws be faithfully executed.&quot; Courts have interpreted this as granting the President broad authority to direct how the executive branch implements the law.</li>
                <li><strong className="text-gray-900 dark:text-white">Statutory authority</strong>: Congress frequently passes laws that delegate implementation authority to the President or executive agencies. When a statute says the President &quot;shall&quot; or &quot;may&quot; take certain actions, an executive order is often the mechanism used to carry that out.</li>
              </ul>
              <p>
                The landmark Supreme Court case <em>Youngstown Sheet &amp; Tube Co. v. Sawyer</em> (1952) established the most widely cited framework for evaluating presidential power. Justice Robert Jackson&apos;s concurring opinion outlined three categories:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Maximum authority</strong>: The President acts with Congressional authorization. Executive power is at its strongest.</li>
                <li><strong className="text-gray-900 dark:text-white">Twilight zone</strong>: Congress has neither granted nor denied authority. The President acts in an area of uncertain constitutional ground.</li>
                <li><strong className="text-gray-900 dark:text-white">Lowest ebb</strong>: The President acts contrary to the expressed will of Congress. Executive power is at its weakest and most likely to be struck down by courts.</li>
              </ul>
              <p>
                This framework continues to be used by courts today when evaluating whether a specific executive order exceeds presidential authority.
              </p>
            </div>
          </section>

          {/* Limits on Executive Power */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              Limits on Executive Power
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Despite their broad scope, executive orders are not unlimited. The American system of separated powers places several important constraints on what a President can accomplish through executive action alone.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Constitutional limits:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Cannot create new law</strong>: Executive orders can direct how existing law is implemented, but they cannot create new legal obligations for private citizens or businesses that are not grounded in statute. Only Congress can pass laws.</li>
                <li><strong className="text-gray-900 dark:text-white">Cannot appropriate money</strong>: The Constitution gives Congress the &quot;power of the purse.&quot; A President cannot use an executive order to spend money that Congress has not authorized and appropriated.</li>
                <li><strong className="text-gray-900 dark:text-white">Cannot override the Constitution</strong>: An executive order that violates constitutional rights, such as free speech, due process, or equal protection, can be struck down by the courts.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Practical limits:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Impermanence</strong>: Any executive order can be revoked by a subsequent President. This makes executive orders a less durable policy tool than legislation. Policies enacted solely through executive action can be reversed with a change of administration.</li>
                <li><strong className="text-gray-900 dark:text-white">Congressional response</strong>: Congress can pass legislation that overrides or defunds an executive order. If Congress passes a law that contradicts an executive order, the law takes precedence.</li>
                <li><strong className="text-gray-900 dark:text-white">Implementation depends on agencies</strong>: Executive orders direct federal agencies, but effective implementation requires agency cooperation, rulemaking, and resources. Complex policy changes through executive order often take months or years to fully implement.</li>
              </ul>
            </div>
          </section>

          {/* How Executive Orders Can Be Challenged */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              How Executive Orders Can Be Challenged
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                The checks and balances built into the American system of government provide several avenues for challenging executive orders that may exceed presidential authority.
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Judicial Review</h3>
                <p>
                  Federal courts can review the legality and constitutionality of executive orders. Any person, state, or organization that can demonstrate they are directly harmed by an executive order (known as &quot;standing&quot;) can file a lawsuit in federal court. Courts can issue injunctions that temporarily block enforcement while the case is decided, or they can permanently strike down an order that violates the Constitution or exceeds statutory authority.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Congressional Action</h3>
                <p>
                  Congress can respond to executive orders in several ways. It can pass legislation that directly overrides the order, though the President could veto such legislation (requiring a two-thirds vote in both chambers to override). Congress can also use the appropriations process to defund implementation of an executive order, refusing to allocate money for the agencies or programs needed to carry it out.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Revocation by a Subsequent President</h3>
                <p>
                  A new President can revoke or modify any existing executive order on their first day in office. This is one of the primary reasons executive orders are considered a less permanent form of policy than legislation. It is common for incoming Presidents to review and revoke a number of their predecessor&apos;s executive orders early in their term.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">State Challenges</h3>
                <p>
                  State attorneys general frequently file lawsuits challenging executive orders that they believe infringe on states&apos; rights or impose unfunded mandates on state governments. These cases often move quickly through the federal court system and can reach the Supreme Court.
                </p>
              </div>
            </div>
          </section>

          {/* Notable Executive Orders in History */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              Notable Executive Orders in History
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Executive orders have shaped American history in profound ways. Some of the most consequential presidential actions were taken not through legislation but through executive directive.
              </p>
              <ul className="list-disc list-inside space-y-3">
                <li>
                  <strong className="text-gray-900 dark:text-white">Emancipation Proclamation (1863)</strong>: President Abraham Lincoln issued Executive Order declaring that enslaved people in Confederate states &quot;shall be then, thenceforward, and forever free.&quot; Issued under the President&apos;s war powers, it transformed the Civil War into a fight against slavery and eventually led to the Thirteenth Amendment.
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Executive Order 9066 (1942)</strong>: President Franklin D. Roosevelt authorized the forced relocation and internment of Japanese Americans during World War II. This order is widely regarded as one of the most significant civil liberties violations in American history. Congress later formally apologized and provided reparations to surviving internees through the Civil Liberties Act of 1988.
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Executive Order 9981 (1948)</strong>: President Harry S. Truman ordered the desegregation of the U.S. armed forces, establishing the policy of &quot;equality of treatment and opportunity for all persons in the armed services without regard to race, color, religion, or national origin.&quot;
                </li>
                <li>
                  <strong className="text-gray-900 dark:text-white">Executive Order 10925 (1961)</strong>: President John F. Kennedy introduced the concept of &quot;affirmative action&quot; for the first time, requiring government contractors to take proactive steps to ensure that hiring and employment practices were free from racial discrimination.
                </li>
              </ul>
              <p>
                You can browse the complete archive of executive orders on the <a href="https://www.federalregister.gov/presidential-documents/executive-orders" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Federal Register</a>. The <a href="https://www.whitehouse.gov/presidential-actions/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">White House website</a> also publishes current executive orders and other presidential actions.
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
                <Link href="/guides/how-congress-votes" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How Congress Votes
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Have Thoughts on Presidential Action?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your representatives in Congress have the power to respond to executive orders through legislation and oversight. Let them know where you stand.
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
