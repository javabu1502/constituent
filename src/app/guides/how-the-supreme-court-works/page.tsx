import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How the Supreme Court Works | My Democracy',
  description: 'Learn how the U.S. Supreme Court operates, including how cases reach the Court, how justices are confirmed, how decisions are made, and how those decisions affect your daily life.',
  keywords: ['Supreme Court', 'SCOTUS', 'judicial review', 'certiorari', 'Supreme Court justices', 'confirmation process', 'constitutional law'],
  openGraph: {
    title: 'How the Supreme Court Works | My Democracy',
    description: 'Learn how the U.S. Supreme Court operates, including how cases reach the Court, how justices are confirmed, how decisions are made, and how those decisions affect your daily life.',
    type: 'article',
  },
};

export default function SupremeCourtGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How the Supreme Court Works', href: '/guides/how-the-supreme-court-works' }]} />
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
          How the Supreme Court Works
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            The Supreme Court of the United States is the highest court in the federal judiciary and the final interpreter of the Constitution. Its decisions shape the law of the land on issues ranging from civil rights to economic regulation to the balance of power between branches of government. Understanding how the Court operates helps you follow its decisions and appreciate how they affect your rights and daily life.
          </p>

          {/* The Role of the Supreme Court */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              The Role of the Supreme Court
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Article III of the U.S. Constitution establishes the Supreme Court and gives Congress the authority to create lower federal courts. The Court&apos;s primary role is to interpret the Constitution and federal law, resolving disputes about what the law means and how it applies.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">The Court&apos;s key functions include:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Judicial review</strong>: The power to determine whether laws passed by Congress or actions taken by the executive branch are consistent with the Constitution. This power, established in <em>Marbury v. Madison</em> (1803), allows the Court to strike down unconstitutional laws.</li>
                <li><strong className="text-gray-900 dark:text-white">Resolving conflicts between courts</strong>: When different federal appeals courts reach different conclusions about the same legal question, the Supreme Court can step in to create a uniform rule that applies nationwide.</li>
                <li><strong className="text-gray-900 dark:text-white">Interpreting federal statutes</strong>: Congress writes laws, but the meaning of those laws is often disputed. The Court determines how statutes should be interpreted and applied.</li>
                <li><strong className="text-gray-900 dark:text-white">Settling disputes between states</strong>: The Constitution gives the Supreme Court original jurisdiction over certain cases, including disputes between two or more states, such as boundary disputes or conflicts over water rights.</li>
              </ul>
              <p>
                The Court is composed of nine justices: one Chief Justice and eight Associate Justices. Justices are appointed by the President, confirmed by the Senate, and serve lifetime appointments during &quot;good behaviour,&quot; as stated in the Constitution. You can learn more about the current Court at <a href="https://www.supremecourt.gov/about/justices.aspx" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">supremecourt.gov</a>.
              </p>
            </div>
          </section>

          {/* How Cases Reach the Court */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
              How Cases Reach the Court
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                The vast majority of cases the Supreme Court hears arrive through a process called <strong className="text-gray-900 dark:text-white">certiorari</strong> (often shortened to &quot;cert&quot;). A party that loses in a lower court can petition the Supreme Court to review the decision. The Court then decides whether to take the case.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">The path to the Supreme Court typically follows these steps:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Trial court</strong>: Most cases begin in a federal district court or a state trial court, where the facts of the case are established.</li>
                <li><strong className="text-gray-900 dark:text-white">Appellate court</strong>: The losing party can appeal to a federal circuit court of appeals (or a state appellate court). These courts review whether the law was applied correctly but generally do not reconsider the facts.</li>
                <li><strong className="text-gray-900 dark:text-white">Petition for certiorari</strong>: The losing party at the appellate level files a petition asking the Supreme Court to hear the case. The petition must explain why the case raises an important legal question worthy of the Court&apos;s attention.</li>
                <li><strong className="text-gray-900 dark:text-white">The &quot;Rule of Four&quot;</strong>: At least four of the nine justices must agree to hear a case for certiorari to be granted. The Court receives thousands of petitions each term and accepts only a small fraction for full review.</li>
              </ul>
              <p>
                The Court is most likely to grant certiorari when there is a &quot;circuit split&quot; (different appeals courts have reached different conclusions on the same legal question), when a case involves a significant constitutional question, or when the federal government requests review through the Solicitor General.
              </p>
              <p>
                In a small number of cases, the Supreme Court has <strong className="text-gray-900 dark:text-white">original jurisdiction</strong>, meaning the case can be filed directly with the Court without going through lower courts first. These cases are defined in the Constitution and include disputes between states and cases involving ambassadors.
              </p>
            </div>
          </section>

          {/* How the Court Decides Cases */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              How the Court Decides Cases
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Once the Court agrees to hear a case, it follows a structured process that unfolds over the course of the Court&apos;s term, which runs from the first Monday in October through late June or early July.
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Written Briefs</h3>
                <p>
                  Both sides submit detailed written arguments called briefs. These legal documents present each party&apos;s interpretation of the law and the facts. Outside parties who have a stake in the outcome, such as advocacy organizations, state governments, or legal scholars, may also submit &quot;amicus curiae&quot; (friend of the court) briefs offering additional perspectives. Amicus briefs can be influential in shaping how the justices think about a case.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Oral Arguments</h3>
                <p>
                  The Court hears oral arguments in the courtroom of the Supreme Court building in Washington, D.C. Each side typically receives 30 minutes to present its case. During this time, justices frequently interrupt with questions, which often signal their concerns and leanings. Oral arguments are open to the public, and audio recordings are made available on the <a href="https://www.supremecourt.gov/oral_arguments/oral_arguments.aspx" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Supreme Court&apos;s website</a>.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Conference and Voting</h3>
                <p>
                  After oral arguments, the justices meet in a private conference to discuss and vote on the case. No one other than the nine justices is present during conference. The Chief Justice leads the discussion, and each justice speaks in order of seniority. A simple majority (five of nine justices) is needed to decide a case.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Writing Opinions</h3>
                <p>
                  The senior justice in the majority assigns the task of writing the majority opinion. This opinion becomes the binding law of the land. The process of writing and circulating draft opinions can take weeks or months, as justices negotiate language and occasionally change their votes.
                </p>
                <ul className="list-disc list-inside space-y-2 mt-2">
                  <li><strong className="text-gray-900 dark:text-white">Majority opinion</strong>: The official opinion of the Court, joined by at least five justices. It establishes the legal precedent.</li>
                  <li><strong className="text-gray-900 dark:text-white">Concurring opinion</strong>: Written by a justice who agrees with the outcome but wants to express different reasoning or emphasize a particular point.</li>
                  <li><strong className="text-gray-900 dark:text-white">Dissenting opinion</strong>: Written by justices who disagree with the majority. Dissents do not have legal force but can influence future courts and signal alternative legal reasoning.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* The Confirmation Process */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              The Confirmation Process
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                When a vacancy occurs on the Supreme Court, whether through retirement, death, or resignation, the President nominates a replacement. The nominee must then be confirmed by the U.S. Senate. This process is outlined in the Constitution&apos;s Appointments Clause (Article II, Section 2).
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">How the confirmation process works:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Presidential nomination</strong>: The President selects a nominee, typically after consulting with legal advisors, members of Congress, and other stakeholders. The President has sole authority to make the nomination.</li>
                <li><strong className="text-gray-900 dark:text-white">Senate Judiciary Committee hearings</strong>: The nominee appears before the Senate Judiciary Committee for public hearings that typically last several days. Senators question the nominee about their legal philosophy, prior rulings, and views on constitutional interpretation. The committee then votes on whether to recommend the nominee to the full Senate.</li>
                <li><strong className="text-gray-900 dark:text-white">Full Senate vote</strong>: The full Senate debates and votes on the nomination. A simple majority (51 votes, or 50 with the Vice President breaking a tie) is required for confirmation.</li>
                <li><strong className="text-gray-900 dark:text-white">Lifetime appointment</strong>: Once confirmed, a justice serves for life or until they choose to retire. There is no term limit. The only mechanism for removing a sitting justice is impeachment by the House of Representatives and conviction by the Senate, which has never resulted in the removal of a Supreme Court justice.</li>
              </ul>
              <p>
                Supreme Court nominations are often among the most consequential decisions a President makes, since justices typically serve for decades. You can contact your senators to share your views on pending nominations. Track nominees and confirmation proceedings at <a href="https://www.congress.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a>.
              </p>
            </div>
          </section>

          {/* How Supreme Court Decisions Affect You */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              How Supreme Court Decisions Affect You
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Supreme Court decisions set binding precedent for every court in the country. When the Court rules on a constitutional question, that interpretation becomes the supreme law of the land until the Court itself revisits the issue or the Constitution is amended. This means the Court&apos;s decisions directly shape the rights and obligations of every American.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Areas where Court decisions have direct impact:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Individual rights</strong>: The Court&apos;s interpretations of the Bill of Rights determine the scope of your freedom of speech, freedom of religion, right to bear arms, protections against unreasonable searches, right to counsel, and many other fundamental liberties.</li>
                <li><strong className="text-gray-900 dark:text-white">Equality and civil rights</strong>: Landmark decisions on equal protection under the Fourteenth Amendment have shaped laws on racial discrimination, gender equality, voting rights, and marriage equality.</li>
                <li><strong className="text-gray-900 dark:text-white">Government power</strong>: The Court determines the boundaries of federal versus state authority, the limits of executive power, and the scope of Congressional legislation. These decisions affect everything from environmental regulation to healthcare policy.</li>
                <li><strong className="text-gray-900 dark:text-white">Criminal justice</strong>: Court rulings shape police procedures, trial rights, sentencing, and the conditions of incarceration. Decisions about Miranda rights, search and seizure standards, and the right to a fair trial directly affect how the criminal justice system operates.</li>
                <li><strong className="text-gray-900 dark:text-white">Economic life</strong>: Decisions on commerce, labor law, intellectual property, and regulatory authority affect businesses, workers, and consumers across every industry.</li>
              </ul>
              <p>
                While you cannot vote for or against Supreme Court justices directly, you can influence the composition of the Court by voting for the President who nominates them and the senators who confirm them. You can also contact your senators to express your views during the confirmation process.
              </p>
              <p>
                To follow current cases and decisions, visit the <a href="https://www.supremecourt.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Supreme Court&apos;s official website</a>, which publishes opinions, oral argument transcripts, and the Court&apos;s calendar.
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
                <Link href="/guides/executive-orders" className="text-purple-600 dark:text-purple-400 hover:underline">
                  What Are Executive Orders and How Do They Work?
                </Link>
              </li>
              <li>
                <Link href="/guides/how-government-spending-works" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Understanding State vs. Federal Power
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Want to Weigh In on the Courts?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your senators vote on Supreme Court nominations. Let them know how you feel about the future of the Court.
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
