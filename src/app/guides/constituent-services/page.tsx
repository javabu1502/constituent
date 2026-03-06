import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Request Help from Your Officials | Constituent Services | My Democracy',
  description: 'Learn how to use constituent services to get help from your congressional office with Social Security, Medicare, VA benefits, immigration, passports, and more.',
  keywords: ['constituent services', 'casework congress', 'help from congressman', 'congressional casework', 'federal agency help', 'VA benefits help', 'passport help congressman'],
  openGraph: {
    title: 'How to Request Help from Your Officials | Constituent Services | My Democracy',
    description: 'Learn how to get free help from your congressional office with federal agency issues.',
    type: 'article',
  },
};

export default function ConstituentServicesGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Constituent Services', href: '/guides/constituent-services' }]} />
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
          How to Request Help from Your Officials
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            One of the most valuable — and least known — services your congressional office provides is casework: helping people in their district resolve problems with federal agencies. This is called casework (free help from your official&apos;s office), and it&apos;s nonpartisan and available to everyone.
          </p>

          {/* What Is Casework */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              What Is Congressional Casework?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Congressional casework is when a member of Congress&apos;s office acts as a liaison between you and a federal agency. Caseworkers — staff members dedicated to this role — contact the agency on your behalf, request status updates, and help resolve delays or disputes. They cannot change the law or guarantee an outcome, but they can often cut through bureaucratic delays.
              </p>
              <p>
                This service is available from both your US Senators&apos; offices and your US House Representative&apos;s office. You can contact any or all of them for help with the same issue.
              </p>
            </div>
          </section>

          {/* Common Issues */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              Common Issues They Can Help With
            </h2>
            <div className="pl-10 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Social Security & Medicare</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Delayed benefits, denied claims, appeals, missing payments, or questions about eligibility. The Social Security Administration (SSA) and Centers for Medicare & Medicaid Services (CMS) are among the most common agencies involved in casework.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Veterans Affairs (VA)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Disability claims, healthcare enrollment, GI Bill benefits, pension issues, and appeals. VA casework is one of the most frequent types congressional offices handle.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Immigration (USCIS & State Department)</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Visa processing delays, green card applications, naturalization, and passport issues. Congressional offices can request status updates from US Citizenship and Immigration Services (USCIS) and the State Department.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">IRS & Tax Issues</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Delayed refunds, identity theft cases, missing stimulus payments, and disputes with the Internal Revenue Service.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Other Federal Agencies</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  FEMA disaster assistance, Small Business Administration loans, federal student loans, military records, and issues with any other federal department or agency.
                </p>
              </div>
            </div>
          </section>

          {/* How to Request Help */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              How to Request Help
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Find your official&apos;s casework page</p>
                    <p className="text-sm">Visit the <Link href="/legislators" className="text-purple-600 dark:text-purple-400 hover:underline">My Democracy legislator directory</Link> to find your representative. Most congressional offices have a &quot;Help with a Federal Agency&quot; or &quot;Casework&quot; page on their official website with an intake form.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Submit a privacy release form</p>
                    <p className="text-sm">Federal agencies can&apos;t share your information with a congressional office without your written permission. You&apos;ll need to sign a Privacy Act release form, which the office will provide.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Provide documentation</p>
                    <p className="text-sm">Gather relevant documents: case numbers, claim IDs, correspondence from the agency, and a clear description of the problem. The more information you provide, the faster the office can help.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">4</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Follow up</p>
                    <p className="text-sm">The caseworker will contact the agency and keep you updated. Response times vary, but don&apos;t hesitate to check in if you haven&apos;t heard back in a few weeks.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Tips for a Successful Request
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300">
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Be specific</strong>: Clearly explain what happened, what you need, and what you&apos;ve already tried.</li>
                <li><strong className="text-gray-900 dark:text-white">Contact the district office</strong>: Casework is handled by district or state office staff, not the Washington, DC office.</li>
                <li><strong className="text-gray-900 dark:text-white">Try all your officials</strong>: You can contact both your senators and your House member. Different offices may have different relationships with the agency.</li>
                <li><strong className="text-gray-900 dark:text-white">Be patient but persistent</strong>: Federal agencies can be slow. A congressional inquiry doesn&apos;t guarantee a different outcome, but it ensures your case gets reviewed.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">How to Contact Your Elected Officials</Link></li>
              <li><Link href="/guides/what-does-my-congressman-do" className="text-purple-600 dark:text-purple-400 hover:underline">What Does My Elected Official Actually Do?</Link></li>
              <li><Link href="/guides/who-are-my-representatives" className="text-purple-600 dark:text-purple-400 hover:underline">Who Are My Elected Officials?</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Need help with a federal agency?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Find your officials and reach out to their casework team.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            Write to Your Officials
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
