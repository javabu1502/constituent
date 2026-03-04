import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Comment on Federal Regulations | My Democracy',
  description: 'Learn how the federal rulemaking process works, how to find proposed rules on Regulations.gov, and how to write public comments that make a difference.',
  keywords: ['federal regulations', 'public comment', 'rulemaking', 'regulations.gov', 'notice and comment', 'federal register', 'proposed rules'],
  openGraph: {
    title: 'How to Comment on Federal Regulations | My Democracy',
    description: 'Learn how the federal rulemaking process works, how to find proposed rules on Regulations.gov, and how to write public comments that make a difference.',
    type: 'article',
  },
};

export default function CommentOnRegulationsGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Comment on Federal Regulations', href: '/guides/how-to-comment-on-regulations' }]} />
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
          How to Comment on Federal Regulations
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Most people think of laws as the main way government sets policy, but federal regulations -the detailed rules that agencies write to implement those laws -often have an even bigger day-to-day impact on your life. The good news is that you have a legal right to weigh in on proposed regulations before they take effect. This guide explains how the process works and how to make your voice count.
          </p>

          {/* What Is Notice-and-Comment Rulemaking? */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              What Is Notice-and-Comment Rulemaking?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                When Congress passes a law, it often directs a federal agency -such as the Environmental Protection Agency, the Department of Labor, or the Food and Drug Administration -to write the detailed rules that put that law into practice. These rules are called regulations, and they carry the force of law.
              </p>
              <p>
                The Administrative Procedure Act (APA), passed in 1946, requires most federal agencies to follow a process called &quot;notice-and-comment rulemaking&quot; before finalizing new regulations. This process has three basic steps:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Notice</strong> -The agency publishes a proposed rule in the <a href="https://www.federalregister.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Federal Register</a>, the daily journal of the U.S. government. The proposal explains what the agency wants to do, why, and the legal authority behind it.</li>
                <li><strong className="text-gray-900 dark:text-white">Comment</strong> -The public is given a period of time -typically 30 to 60 days, though it can be longer -to submit written comments on the proposed rule. Anyone can comment: individuals, businesses, organizations, state and local governments.</li>
                <li><strong className="text-gray-900 dark:text-white">Final rule</strong> -The agency reviews all comments, responds to significant issues raised, and publishes a final rule. The agency must explain how it considered public input and why it made the choices it did in the final version.</li>
              </ul>
              <p>
                This process exists because agencies are not elected bodies. Public comment is the primary mechanism for democratic accountability in the regulatory process, and agencies are legally required to consider it.
              </p>
            </div>
          </section>

          {/* Finding Proposed Rules */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              Finding Proposed Rules
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                <a href="https://www.regulations.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Regulations.gov</a> is the federal government&apos;s official portal for public participation in the rulemaking process. It&apos;s where you can find proposed rules that are currently open for comment, read the full text of proposals, view comments that others have submitted, and submit your own.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">How to search for proposed rules:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">By keyword</strong> -Use the search bar on Regulations.gov to search for topics you care about, such as &quot;clean water,&quot; &quot;workplace safety,&quot; or &quot;student loans.&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">By agency</strong> -If you know which agency handles your area of interest, you can filter by agency. For example, the Department of Education for student loan rules, or the EPA for environmental regulations.</li>
                <li><strong className="text-gray-900 dark:text-white">By document type</strong> -Filter for &quot;Proposed Rules&quot; to see only regulations that are currently open for comment.</li>
                <li><strong className="text-gray-900 dark:text-white">By comment deadline</strong> -Sort results by closing date to prioritize rules whose comment periods are ending soon.</li>
              </ul>
              <p>
                You can also browse the <a href="https://www.federalregister.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Federal Register</a> directly. The Federal Register publishes every proposed and final rule along with the agency&apos;s detailed explanation. It offers email subscriptions so you can receive notifications when new proposed rules are published in topic areas you follow.
              </p>
            </div>
          </section>

          {/* Writing an Effective Comment */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
              Writing an Effective Comment
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Public comments on regulations are different from letters to Congress. Agencies are required by law to respond to substantive comments, so a well-reasoned comment grounded in evidence or personal experience can genuinely influence the final rule.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">What makes a comment effective:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Be specific</strong> -Reference the particular section or provision of the proposed rule you&apos;re commenting on. General statements like &quot;I oppose this rule&quot; without explanation carry less weight than targeted feedback on specific provisions.</li>
                <li><strong className="text-gray-900 dark:text-white">Explain your reasoning</strong> -Agencies must respond to the substance of comments. If you explain why a provision would help or harm you, your community, or your industry, the agency must address that reasoning in its final rule.</li>
                <li><strong className="text-gray-900 dark:text-white">Share your personal experience</strong> -If the regulation affects you directly, describe how. A small business owner explaining how a proposed reporting requirement would cost them time and money provides the kind of real-world information agencies need.</li>
                <li><strong className="text-gray-900 dark:text-white">Provide data or evidence</strong> -If you have access to relevant research, data, or expert analysis, include it or cite it. Agencies are more likely to adjust a rule in response to evidence-based arguments.</li>
                <li><strong className="text-gray-900 dark:text-white">Suggest alternatives</strong> -If you disagree with a proposed approach, suggest a different way to achieve the same goal. Agencies appreciate constructive solutions.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">What to avoid:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Form letters or identical comments copied from a website -agencies often count these in bulk but do not need to respond to them individually</li>
                <li>Threats, personal attacks, or profanity -these undermine your credibility and may be disregarded</li>
                <li>Comments that address topics outside the scope of the proposed rule -agencies are only required to respond to comments relevant to the specific proposal</li>
              </ul>
            </div>
          </section>

          {/* Submitting Your Comment */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </span>
              Submitting Your Comment
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                The easiest way to submit a comment is through <a href="https://www.regulations.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Regulations.gov</a>. Here&apos;s the process:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Find the proposed rule</strong> -Search for it on Regulations.gov using keywords, the docket number, or the agency name.</li>
                <li><strong className="text-gray-900 dark:text-white">Click &quot;Comment&quot;</strong> -On the rule&apos;s page, you&apos;ll find a button to submit a comment. You can type directly into the text box or upload a document.</li>
                <li><strong className="text-gray-900 dark:text-white">Identify yourself (optional but recommended)</strong> -You can submit comments anonymously, but including your name, organization, and relevant credentials lends credibility. If you&apos;re commenting as someone directly affected by the rule, say so.</li>
                <li><strong className="text-gray-900 dark:text-white">Attach supporting documents</strong> -If you have research, data, or other materials that support your comment, you can upload them as attachments.</li>
                <li><strong className="text-gray-900 dark:text-white">Submit before the deadline</strong> -Comment periods have firm closing dates. Late comments may not be considered. Set a reminder well before the deadline to give yourself time to draft and review your comment.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Other ways to submit:</strong> Most proposed rules also include a mailing address for paper comments and sometimes a fax number. These methods are valid but slower -if you mail a comment, allow extra time for delivery before the deadline.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Be aware:</strong> Comments submitted to Regulations.gov are part of the public record. Your comment, including your name if you provide it, will generally be visible to anyone who looks at the docket. Do not include personal information you wouldn&apos;t want made public, such as your Social Security number or financial account details.
              </p>
            </div>
          </section>

          {/* What Happens After You Comment */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
              What Happens After You Comment
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                After the comment period closes, the agency reviews all comments it received. This can take months or even years, depending on the complexity of the rule and the volume of comments.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">The agency&apos;s obligations:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Read and consider all comments</strong> -Agencies are legally required to consider the substantive issues raised in public comments. This doesn&apos;t mean they have to agree with you, but they can&apos;t ignore relevant arguments.</li>
                <li><strong className="text-gray-900 dark:text-white">Respond to significant comments</strong> -When the agency publishes the final rule, it must include a preamble that summarizes the comments received and explains how the agency responded. If commenters raised a valid concern, the agency must explain why it did or did not change the rule in response.</li>
                <li><strong className="text-gray-900 dark:text-white">Publish the final rule</strong> -The final rule is published in the Federal Register. It may be identical to the proposed rule, substantially revised, or withdrawn entirely based on public input and other factors.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Your comment can make a real difference.</strong> Agencies regularly modify proposed rules based on public comments. Comments that identify unintended consequences, provide relevant data, or offer practical alternatives are particularly influential. Courts have even struck down final rules when agencies failed to adequately respond to substantive public comments -your input is part of the legal foundation of the regulatory process.
              </p>
              <p>
                You can track the status of a rule by checking back on its docket page on <a href="https://www.regulations.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Regulations.gov</a>, where the agency will post the final rule once it is published.
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
                <Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Write an Effective Letter to Congress
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-contact-your-congressman" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Contact Your Congressman
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Want to go beyond regulations?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Reach out directly to your elected representatives about the laws and policies that matter to you.
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
