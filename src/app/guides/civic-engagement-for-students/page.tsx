import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Civic Engagement for Students and Young Adults | My Democracy',
  description: 'A guide for students and young adults on getting civically engaged: voter registration and pre-registration, campus organizing, government internships, and building lifelong civic habits.',
  keywords: ['civic engagement students', 'young voter registration', 'campus organizing', 'student government', 'government internships', 'pre-register to vote', 'youth civic engagement', 'college civic engagement'],
  openGraph: {
    title: 'Civic Engagement for Students and Young Adults | My Democracy',
    description: 'A practical guide for students and young adults on voter registration, campus organizing, government internships, and building lifelong civic habits.',
    type: 'article',
  },
};

export default function CivicEngagementStudentsGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Civic Engagement for Students', href: '/guides/civic-engagement-for-students' }]} />
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
          Civic Engagement for Students and Young Adults
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            You don&apos;t have to wait until you&apos;re older to participate in democracy. Students and young adults bring energy, fresh perspectives, and a direct stake in the future to civic life. Whether you&apos;re in high school, college, or just starting your career, there are meaningful ways to engage right now — from registering to vote to organizing on campus to pursuing careers in public service.
          </p>

          {/* Why Start Now? */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Why Start Now?
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Civic habits formed early tend to last a lifetime. Research in political science consistently shows that people who vote in their first eligible election are significantly more likely to continue voting in future elections. The same pattern holds for other forms of participation — attending community meetings, contacting elected officials, and volunteering for causes.
              </p>
              <p>
                Policy decisions made today — on education funding, climate policy, student debt, housing, and healthcare — will shape your life for decades. Young people are directly affected by these decisions, and elected officials pay attention when young constituents speak up. Getting involved now means having a say in the outcomes that matter most to your generation.
              </p>
              <p>
                Civic engagement also builds skills that are valuable in any career: public speaking, teamwork, research, persuasive writing, and project management. Whether or not you pursue a career in government, these skills will serve you well.
              </p>
            </div>
          </section>

          {/* Registering and Pre-Registering to Vote */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Registering and Pre-Registering to Vote
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Voting is one of the most direct ways to influence government. The first step is making sure you&apos;re registered:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Pre-registration for 16- and 17-year-olds</strong>: Many states allow you to pre-register to vote before you turn 18. Your registration becomes active on your 18th birthday (or when you become eligible). Check your state&apos;s rules at <a href="https://vote.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">vote.gov</a>.</li>
                <li><strong className="text-gray-900 dark:text-white">Register when you turn 18</strong>: If your state doesn&apos;t offer pre-registration, register as soon as you&apos;re eligible. You can register online in most states through <a href="https://vote.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">vote.gov</a>, at your local DMV, or at your county election office.</li>
                <li><strong className="text-gray-900 dark:text-white">College students</strong>: You can generally choose to register either at your campus address or your home address — but not both. Consider which location gives you easier access to the polls and where your vote may have the most impact on races you care about. Check our <Link href="/guides/how-to-register-to-vote" className="text-purple-600 dark:text-purple-400 hover:underline">voter registration guide</Link> for step-by-step instructions.</li>
                <li><strong className="text-gray-900 dark:text-white">Know your deadlines</strong>: Registration deadlines vary by state. Some states offer same-day registration, while others require you to register weeks before an election. Plan ahead.</li>
              </ul>
            </div>
          </section>

          {/* Getting Involved on Campus */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Getting Involved on Campus
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                College campuses are natural hubs for civic engagement. There are many ways to get involved beyond just voting:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Student government</strong>: Running for or participating in student government gives you hands-on experience with democratic processes — drafting resolutions, representing constituents, allocating budgets, and working with administrators.</li>
                <li><strong className="text-gray-900 dark:text-white">Political and advocacy clubs</strong>: Most campuses have chapters of organizations spanning the political spectrum, as well as issue-specific groups focused on the environment, civil rights, public health, and more. If your campus doesn&apos;t have a club for your interest, consider starting one.</li>
                <li><strong className="text-gray-900 dark:text-white">Voter registration drives</strong>: Organizing a voter registration drive on campus is one of the most impactful things you can do. Partner with your student government, residence life office, or campus organizations to set up registration tables before election deadlines.</li>
                <li><strong className="text-gray-900 dark:text-white">Community service and service-learning</strong>: Many colleges offer service-learning courses that combine academic study with community engagement. These programs connect classroom learning to real-world civic issues.</li>
                <li><strong className="text-gray-900 dark:text-white">Attend public meetings</strong>: City council and school board meetings are open to the public. Attending as a student shows local officials that young people are paying attention, and it gives you firsthand experience with how local government works. See our guide on <Link href="/guides/how-to-organize-your-neighbors" className="text-purple-600 dark:text-purple-400 hover:underline">organizing your neighbors</Link> for tips on collective action.</li>
              </ul>
            </div>
          </section>

          {/* Internships and Fellowships in Government */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              Internships and Fellowships in Government
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Working in government — even temporarily — gives you an inside understanding of how policy is made and how public institutions serve communities:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Congressional internships</strong>: Members of Congress offer internships in both their Washington, D.C. offices and their district or state offices. These positions involve answering constituent calls, attending hearings, researching policy issues, and assisting staff. Apply directly through your representative&apos;s or senator&apos;s official website.</li>
                <li><strong className="text-gray-900 dark:text-white">State legislature internships</strong>: Most state legislatures run internship programs during the legislative session. These opportunities let you observe the lawmaking process up close and are often less competitive than federal positions.</li>
                <li><strong className="text-gray-900 dark:text-white">Local government</strong>: City halls, county offices, and local agencies frequently seek interns and volunteers. These roles are a great way to learn how local government directly affects your community — from zoning decisions to public transit to parks and recreation.</li>
                <li><strong className="text-gray-900 dark:text-white">Federal agencies</strong>: Many federal agencies offer student internship programs. You can search for opportunities through <a href="https://www.usa.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">usa.gov</a> or the federal government&apos;s official job board at USAJOBS.</li>
                <li><strong className="text-gray-900 dark:text-white">Civic fellowships</strong>: Organizations across the country offer fellowships for young people interested in public service, policy research, and civic leadership. These programs often include mentorship, training, and a stipend. Your college&apos;s career services office or political science department can help you find programs that fit your interests.</li>
              </ul>
            </div>
          </section>

          {/* Building Lifelong Civic Habits */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              Building Lifelong Civic Habits
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-3">
              <p>
                Civic engagement isn&apos;t something you do once — it&apos;s a set of habits that grow stronger with practice. Here are ways to weave participation into your everyday life:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Vote in every election</strong>: Federal, state, local, primary, runoff, and special elections all matter. Many consequential decisions — school board seats, local ballot measures, district attorney races — are decided in low-turnout elections where every vote carries more weight.</li>
                <li><strong className="text-gray-900 dark:text-white">Stay informed</strong>: Follow local news, read about the issues your representatives are working on, and check how they vote. Our <Link href="/guides/how-to-track-legislation" className="text-purple-600 dark:text-purple-400 hover:underline">legislation tracking guide</Link> can help you stay up to date.</li>
                <li><strong className="text-gray-900 dark:text-white">Contact your representatives regularly</strong>: You don&apos;t have to wait for a crisis. A brief phone call or email sharing your perspective on a pending bill takes just a few minutes and helps your representative understand their constituents&apos; priorities.</li>
                <li><strong className="text-gray-900 dark:text-white">Engage in your community</strong>: Attend neighborhood meetings, volunteer with local organizations, and get to know the people working on issues you care about. Civic engagement extends well beyond elections.</li>
                <li><strong className="text-gray-900 dark:text-white">Be a reliable source for friends and family</strong>: Share what you learn. Help friends register to vote, explain what&apos;s on the ballot, and encourage the people around you to participate. Civic engagement is contagious.</li>
              </ul>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li><Link href="/guides/how-to-register-to-vote" className="text-purple-600 dark:text-purple-400 hover:underline">How to Register to Vote</Link></li>
              <li><Link href="/guides/how-to-organize-your-neighbors" className="text-purple-600 dark:text-purple-400 hover:underline">How to Organize Your Neighbors Around an Issue</Link></li>
              <li><Link href="/guides/how-to-get-involved-in-local-politics" className="text-purple-600 dark:text-purple-400 hover:underline">How to Get Involved in Local Politics</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Ready to make your voice count?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Start by finding your elected officials and reaching out to them on the issues you care about.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors">
            Contact Your Reps
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
