import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Run a Successful Campaign | My Democracy',
  description: 'Learn how to create a compelling advocacy campaign that rallies others to contact their representatives. Tips on headlines, descriptions, messaging, sharing, and tracking success.',
  keywords: ['advocacy campaign', 'grassroots campaign', 'civic engagement', 'contact congress', 'collective action', 'campaign tips'],
  openGraph: {
    title: 'How to Run a Successful Campaign | My Democracy',
    description: 'Learn how to create a compelling advocacy campaign that rallies others to contact their representatives.',
    type: 'article',
  },
};

export default function CampaignGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'How to Run a Successful Campaign', href: '/guides/how-to-run-a-successful-campaign' }]} />
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
          How to Run a Successful Campaign
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            A campaign turns one person&apos;s concern into a collective voice. When dozens or hundreds of constituents contact their representatives about the same issue — each with their own personal story — legislators pay attention. Here&apos;s how to make your campaign as effective as possible.
          </p>

          {/* Why Campaigns Work */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Why Campaigns Work
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Congressional offices tally every message they receive, and volume matters. When a staffer sees 50 messages about the same issue in a week, that gets elevated to the legislator. A single voice is easy to overlook — a chorus is impossible to ignore.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Campaigns amplify impact because:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Volume signals priority</strong> — Staffers report constituent sentiment in weekly briefings. A spike in messages on an issue moves it up the priority list.</li>
                <li><strong className="text-gray-900 dark:text-white">Every message is unique</strong> — Unlike petition signatures, each campaign participant sends a personalized message with their own story. This carries far more weight than a form letter.</li>
                <li><strong className="text-gray-900 dark:text-white">Geographic spread matters</strong> — Messages from across a district prove an issue isn&apos;t limited to one neighborhood.</li>
                <li><strong className="text-gray-900 dark:text-white">It&apos;s harder to dismiss</strong> — One email is easy to file away. Fifty unique, personal messages from real constituents demand a response.</li>
              </ul>
            </div>
          </section>

          {/* Writing a Compelling Headline */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </span>
              Writing a Compelling Headline
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Your headline is the first thing people see. It needs to immediately communicate what the campaign is about and why someone should care. Think of it as the subject line of the most important email you&apos;ve ever sent.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">What makes a great headline:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Be specific</strong> — &quot;Protect funding for Lincoln Elementary&apos;s after-school program&quot; beats &quot;Save our schools&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">Use action words</strong> — Start with verbs like &quot;Protect,&quot; &quot;Stop,&quot; &quot;Support,&quot; &quot;Demand,&quot; &quot;Fund&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">Make it local</strong> — If this affects a specific community, name it</li>
                <li><strong className="text-gray-900 dark:text-white">Keep it under 80 characters</strong> — Short enough to share easily and display well on mobile</li>
              </ul>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm space-y-2">
                <p><span className="text-green-600 dark:text-green-400">Good:</span> &quot;Stop the closure of Riverside Community Health Center&quot;</p>
                <p><span className="text-green-600 dark:text-green-400">Good:</span> &quot;Fund clean water infrastructure for Jackson County&quot;</p>
                <p><span className="text-red-600 dark:text-red-400">Weak:</span> &quot;Healthcare matters&quot;</p>
                <p><span className="text-red-600 dark:text-red-400">Weak:</span> &quot;We need better water&quot;</p>
              </div>
            </div>
          </section>

          {/* Writing a Description That Motivates */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </span>
              Writing a Description That Motivates
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Your description is your pitch. Someone is deciding whether to spend five minutes taking action — give them a reason.
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Start with the problem</h3>
                  <p>
                    What&apos;s happening or about to happen? Be concrete. &quot;The state budget proposes cutting $2M from community mental health services&quot; is more compelling than &quot;mental health funding is at risk.&quot;
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Explain why it matters</h3>
                  <p>
                    Who is affected? How many people? What happens if nothing changes? Connect the policy to real human impact.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Show the path forward</h3>
                  <p>
                    What can legislators actually do? Is there a bill to support or oppose? A budget vote coming up? People are more likely to act when they can see how their message makes a difference.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. Create urgency</h3>
                  <p>
                    If there&apos;s a deadline — a vote date, a budget hearing, a comment period — mention it. Urgency drives action.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Tips for the Message Template */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </span>
              Tips for the Message Template
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                The message template is optional but powerful. It gives the AI context for generating each participant&apos;s personalized letter. Think of it as the talking points you&apos;d give someone before a meeting.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Keep these principles in mind:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">One ask, not ten</strong> — Focus on a single, specific action you want legislators to take. &quot;Vote YES on SB 456&quot; is better than a list of grievances. Messages with a clear ask are more likely to be logged correctly.</li>
                <li><strong className="text-gray-900 dark:text-white">Be specific about the action</strong> — &quot;Co-sponsor HR 789&quot; or &quot;Vote to restore the $2M budget line for community clinics&quot; gives staffers something actionable to report.</li>
                <li><strong className="text-gray-900 dark:text-white">Include key facts</strong> — Mention 2-3 supporting points that participants might not know. The AI will weave these into each personalized letter alongside the participant&apos;s own story.</li>
                <li><strong className="text-gray-900 dark:text-white">Set the tone</strong> — If you want messages to be urgent, professional, hopeful, or firm, say so. The AI picks up on tone cues.</li>
                <li><strong className="text-gray-900 dark:text-white">Don&apos;t write a full letter</strong> — The AI generates unique messages for each participant. Provide the substance and direction, not the exact wording.</li>
              </ul>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm space-y-3">
                <p className="font-medium text-gray-900 dark:text-white">Example template:</p>
                <p>
                  &quot;Ask them to vote YES on SB 456, the Community Mental Health Services Act. Key points: This bill would restore $2M in funding for community clinics that serve 15,000 residents. Three clinics in our district have already reduced hours due to budget cuts. The vote is expected in the next two weeks. Tone: professional and urgent.&quot;
                </p>
              </div>
            </div>
          </section>

          {/* Sharing Your Campaign */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </span>
              How to Share Your Campaign Effectively
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                A campaign is only as powerful as its reach. The good news: you don&apos;t need a massive following. You need the right people — constituents who live in the relevant districts and care about the issue.
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Social Media</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Share the campaign link with a personal message about why you started it</li>
                    <li>Tag relevant local organizations, journalists, or community leaders</li>
                    <li>Post in local Facebook groups, Nextdoor, and community subreddits</li>
                    <li>Use relevant hashtags but keep them local — #SpringfieldIL is more targeted than #SaveHealthcare</li>
                    <li>Share updates as your action count grows — momentum attracts more participants</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Send to friends, family, and colleagues who live in the affected area</li>
                    <li>Write a short personal note — don&apos;t just drop a link</li>
                    <li>Ask people to forward it to others who might care</li>
                    <li>Follow up after a few days with an update on how many people have taken action</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Community Groups</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Share at PTA meetings, church groups, neighborhood associations, or professional organizations</li>
                    <li>Ask group leaders if they can share on your behalf — a recommendation from a trusted leader carries weight</li>
                    <li>Offer to present briefly about the issue and make it easy for people to take action on the spot</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Word of Mouth</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>The most effective outreach is personal. One-on-one conversations convert better than broadcast posts.</li>
                    <li>Text the link directly to people you think would care</li>
                    <li>Explain why you started the campaign and why their participation matters</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* What Makes a Personal Story Impactful */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              What Makes a Personal Story Impactful
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                When participants add their personal story to your campaign, it transforms a generic message into something that moves legislators. Here&apos;s what you should encourage participants to share:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Be specific</strong> — &quot;My 8-year-old can&apos;t get speech therapy because the waitlist at our community clinic is 6 months&quot; hits harder than &quot;healthcare access is a problem&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">Make it personal</strong> — First-person experiences (&quot;I&quot; and &quot;my family&quot;) carry more weight than third-person observations (&quot;people are struggling&quot;)</li>
                <li><strong className="text-gray-900 dark:text-white">Connect to the policy</strong> — The best stories draw a clear line between the problem and the legislation. &quot;If this clinic closes, 200 families in our neighborhood lose access to affordable mental health care&quot;</li>
                <li><strong className="text-gray-900 dark:text-white">Include real details</strong> — Dollar amounts, wait times, distances traveled, choices faced. Specifics are what make staffers stop and read.</li>
                <li><strong className="text-gray-900 dark:text-white">Show the stakes</strong> — What happens if nothing changes? What would change if the legislation passes?</li>
              </ul>
              <p>
                You can include guidance like this in your campaign description to help participants write stronger stories. For more, see our full guide on <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">telling your story effectively</Link>.
              </p>
            </div>
          </section>

          {/* Tracking Your Campaign's Success */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              How to Track Your Campaign&apos;s Success
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Your dashboard shows real-time campaign analytics. Here&apos;s how to interpret them and use them to grow your campaign:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Action count</strong> — The total number of people who have participated. Share milestones (&quot;We hit 50 actions!&quot;) to build momentum.</li>
                <li><strong className="text-gray-900 dark:text-white">Messages sent</strong> — The total messages delivered to representatives. This is the number that matters to congressional offices.</li>
                <li><strong className="text-gray-900 dark:text-white">States represented</strong> — Geographic diversity shows the issue isn&apos;t limited to one area. If you notice gaps, target your sharing efforts there.</li>
                <li><strong className="text-gray-900 dark:text-white">Recent actions</strong> — See when people are participating. A surge after sharing on a particular platform tells you where your audience is.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">What to do with your data:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Share progress updates — &quot;47 people have sent messages to their representatives this week&quot;</li>
                <li>Identify which sharing channels drive the most participation and double down</li>
                <li>If growth slows, try a new angle or share a participant&apos;s story (with permission)</li>
                <li>Set goals and celebrate them publicly — &quot;Help us reach 100 actions by Friday&quot;</li>
              </ul>
            </div>
          </section>

          {/* Quick Checklist */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Campaign Launch Checklist
            </h2>
            <div className="pl-10">
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span>Headline is specific, action-oriented, and under 80 characters</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span>Description explains the problem, why it matters, and what action to take</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span>Message template focuses on one specific legislative ask</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span>Correct target level selected (federal, state, or both)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span>Tested the campaign page yourself before sharing</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span>Shared to at least 3 channels (social, email, community group)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span>Plan to share follow-up updates with action count milestones</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Real Campaign Examples */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </span>
              Real Campaign Examples
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-6">
              <p>
                Sometimes the best way to learn is by example. Here are three real-world scenarios that show how effective campaigns come together — from local neighborhood issues to statewide policy fights.
              </p>

              {/* Example 1 */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">&quot;Save the Maplewood Library Branch&quot;</h3>
                <p className="text-sm"><strong className="text-gray-900 dark:text-white">Scale:</strong> 30 participants, 90 messages to city council</p>
                <div className="space-y-2">
                  <p><strong className="text-gray-900 dark:text-white">The situation:</strong> The city proposed closing the Maplewood branch library to cut costs. A parent who used the branch for children&apos;s programming decided to fight back.</p>
                  <p><strong className="text-gray-900 dark:text-white">Their approach:</strong> Created a campaign with a clear headline — &quot;Keep the Maplewood Library Open for Our Kids&quot; — and a description that cited specific usage numbers: 200 children attended summer reading programs, 45 seniors used the free computer lab weekly, and the branch served as the only public meeting space in a 3-mile radius.</p>
                  <p><strong className="text-gray-900 dark:text-white">How they shared it:</strong> Posted in the neighborhood Facebook group, shared at a PTA meeting, and texted the link to 15 parents from story time. Each of those parents shared it with a few more.</p>
                  <p><strong className="text-gray-900 dark:text-white">Results:</strong> 30 residents sent personalized messages to all five city council members within 10 days — 90 messages total. Two council members cited the volume of constituent correspondence when they voted against the closure. The library stayed open.</p>
                  <p><strong className="text-gray-900 dark:text-white">What made it work:</strong> Hyper-local focus, specific data points in the description, and personal sharing through trusted community channels. Every message included a real story about how the library mattered to that family.</p>
                </div>
              </div>

              {/* Example 2 */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">&quot;Stop the 15% Tuition Hike at State Universities&quot;</h3>
                <p className="text-sm"><strong className="text-gray-900 dark:text-white">Scale:</strong> 200+ participants across 15 legislative districts</p>
                <div className="space-y-2">
                  <p><strong className="text-gray-900 dark:text-white">The situation:</strong> The state Board of Regents proposed a 15% tuition increase across all public universities. A college junior studying education realized the increase would force her to take on an additional $8,000 in loans.</p>
                  <p><strong className="text-gray-900 dark:text-white">Their approach:</strong> The headline — &quot;Tell Your State Rep: Block the 15% Tuition Increase&quot; — named the exact policy and the ask. The message template focused on a single action: urging reps to vote NO on the appropriations bill that enabled the increase, and included key facts about student debt averages and the state&apos;s higher-ed funding trends.</p>
                  <p><strong className="text-gray-900 dark:text-white">How they shared it:</strong> Shared in student government Slack channels at three universities, posted in campus organization group chats, and emailed to every student org listserv they could find. A campus newspaper wrote about the campaign after seeing it circulate, which drove another wave of participation.</p>
                  <p><strong className="text-gray-900 dark:text-white">Results:</strong> Over 200 students from 15 different districts sent personalized messages to their state representatives. The geographic spread was key — legislators from rural and suburban districts heard from constituents they wouldn&apos;t normally hear from on higher-ed issues. The tuition increase was reduced from 15% to 6%.</p>
                  <p><strong className="text-gray-900 dark:text-white">What made it work:</strong> The campaign gave students a way to channel frustration into structured political action. Instead of a petition with anonymous signatures, every legislator received unique, personal letters from verified constituents in their own district. The statewide geographic coverage made it impossible to dismiss as a single-campus issue.</p>
                </div>
              </div>

              {/* Example 3 */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">&quot;Install Protected Crosswalks on Route 9 Before Someone Else Gets Hurt&quot;</h3>
                <p className="text-sm"><strong className="text-gray-900 dark:text-white">Scale:</strong> 65 participants, messages to local officials + state DOT</p>
                <div className="space-y-2">
                  <p><strong className="text-gray-900 dark:text-white">The situation:</strong> After a pedestrian was hit crossing Route 9 near an elementary school, a neighbor decided the community had waited long enough for the crosswalk improvements that had been promised for years.</p>
                  <p><strong className="text-gray-900 dark:text-white">Their approach:</strong> The campaign targeted both local selectboard members and the state Department of Transportation. The description included specifics: four pedestrian incidents at the same intersection in three years, a state traffic study from two years prior that recommended improvements but was never funded, and the fact that 300 children crossed that intersection daily during the school year.</p>
                  <p><strong className="text-gray-900 dark:text-white">How they shared it:</strong> Started with the school&apos;s parent email list, then posted on Nextdoor and shared at a community safety forum. A local TV station covered the story, and the campaign organizer shared the link during the broadcast interview.</p>
                  <p><strong className="text-gray-900 dark:text-white">Results:</strong> 65 residents sent messages over two weeks. The selectboard added crosswalk improvements to the next town meeting agenda, and the state DOT fast-tracked a safety review. Protected crosswalks with flashing beacons were installed within six months.</p>
                  <p><strong className="text-gray-900 dark:text-white">What made it work:</strong> Urgency driven by a real incident, combined with data that showed a pattern. The dual targeting of local and state officials ensured that neither level of government could point to the other as responsible. Media coverage amplified reach beyond the organizer&apos;s personal network.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Social Media Templates */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </span>
              Social Media Templates
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-6">
              <p>
                Not sure what to say when you share your campaign? Here are ready-to-use templates for each platform. Copy, customize with your campaign details, and post.
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">X / Twitter</h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm font-mono whitespace-pre-wrap">I started a campaign to [brief description of your issue]. It takes 2 minutes to send a personalized message to your rep. Join us: [campaign link] #[YourCity] #[IssueHashtag] #TakeAction</p>
                </div>
                <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Tip: Keep it under 280 characters. Use local hashtags (#SpringfieldIL, #District5) to reach the right audience. Tag local journalists or organizations for amplification.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Facebook</h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm font-mono whitespace-pre-wrap">Hey friends — I need your help with something that matters to me personally.{'\n\n'}[Explain the issue in 2-3 sentences: what&apos;s happening, who it affects, and why you care.]{'\n\n'}I created a campaign page that makes it easy to send a personalized message to your representative. It takes about 2 minutes, and you don&apos;t need to write anything from scratch — just add your story and the tool does the rest.{'\n\n'}If you live in [state/city/district], your voice really matters here. Even if you don&apos;t, please consider sharing this with someone who does.{'\n\n'}[campaign link]{'\n\n'}Thank you for caring about this.</p>
                </div>
                <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Tip: Personal posts outperform formal ones. Share why this issue matters to you specifically. Tag friends who live in the affected area.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instagram Stories</h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm font-mono whitespace-pre-wrap">Slide 1: &quot;Did you know [surprising fact about the issue]?&quot;{'\n'}Slide 2: &quot;[Brief explanation of what&apos;s at stake]&quot;{'\n'}Slide 3: &quot;I started a campaign to do something about it. It takes 2 min to send your rep a message.&quot;{'\n'}Slide 4: &quot;Link in bio&quot; or use the link sticker with your campaign URL</p>
                </div>
                <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Tip: Use bold text overlays and keep each slide to one idea. Add a poll sticker (&quot;Do you think [issue] matters?&quot;) to boost engagement before the call to action.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Text Message</h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm font-mono whitespace-pre-wrap">Hey [name]! I started a campaign about [issue] and could really use your help. It takes 2 min to send a message to your rep: [campaign link]. Would mean a lot!</p>
                </div>
                <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Tip: Texts have the highest conversion rate of any channel. Send to people you know personally and who live in the affected area. Keep it casual and direct.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email to Friends / Colleagues</h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm font-mono whitespace-pre-wrap">Subject: Can you take 2 minutes to help with [issue]?{'\n\n'}Hi [name],{'\n\n'}I&apos;m reaching out because [explain your personal connection to the issue in 1-2 sentences].{'\n\n'}[Describe the issue and what&apos;s at stake in 2-3 sentences.]{'\n\n'}I created a campaign page that makes it easy to send a personalized message to your representative. You just add a brief personal story and the tool generates a unique letter. It takes about 2 minutes.{'\n\n'}Here&apos;s the link: [campaign link]{'\n\n'}If this isn&apos;t your issue, no worries at all — but if you could forward this to anyone who might care, that would help too.{'\n\n'}Thanks,{'\n'}[Your name]</p>
                </div>
                <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Tip: Personalize the subject line and opening. Emails from someone you know have much higher open rates than mass messages. Send to small batches rather than one big BCC list.</p>
              </div>
            </div>
          </section>

          {/* Campaign Timeline */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Campaign Timeline
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-6">
              <p>
                A successful campaign doesn&apos;t happen all at once. Here&apos;s a recommended timeline from research to results, so you can plan your effort strategically.
              </p>

              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Day 1-2: Research the Issue</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Identify the specific policy, bill, or decision you want to influence</li>
                    <li>Find out who has the power to act — is this a city council vote, a state legislature issue, or a federal matter?</li>
                    <li>Gather 3-5 key facts or data points that support your position</li>
                    <li>Check if there&apos;s a deadline (vote date, comment period, budget hearing) that creates natural urgency</li>
                    <li>Look for existing organizations or groups already working on the issue — they can be sharing partners later</li>
                  </ul>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Day 3: Create the Campaign</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Write your headline — specific, action-oriented, under 80 characters</li>
                    <li>Write your description — problem, impact, path forward, and urgency</li>
                    <li>Draft the message template — one clear ask with supporting facts and a tone direction</li>
                    <li>Select the correct legislative target level (federal, state, or both)</li>
                    <li>Review everything once more before publishing</li>
                  </ul>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Day 4: Soft Launch</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Share with 5-10 close contacts and ask them to go through the full flow</li>
                    <li>Ask for honest feedback: Is the description clear? Does the generated message sound right?</li>
                    <li>Check that the campaign page looks good on mobile — most people will see it on their phone</li>
                    <li>Make any adjustments based on feedback before going wide</li>
                  </ul>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Day 5-7: Full Launch</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Share across all channels: social media, email, text messages, community groups</li>
                    <li>Use the social media templates in this guide as a starting point</li>
                    <li>Ask your soft-launch participants to share with their own networks</li>
                    <li>Post at different times of day to catch different audiences</li>
                    <li>Respond to comments and questions to keep engagement going</li>
                  </ul>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Week 2: Share Updates and Hit Milestones</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Post progress updates: &quot;42 people have sent messages to their representatives so far!&quot;</li>
                    <li>Share a participant&apos;s story (with permission) to show the human impact</li>
                    <li>Set a public goal: &quot;Help us reach 100 actions by Friday&quot;</li>
                    <li>Reach out to local media or bloggers — a campaign with momentum is a story worth covering</li>
                    <li>Try a new channel you haven&apos;t used yet (Nextdoor, a different community group, a local subreddit)</li>
                  </ul>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Week 3+: Follow Up and Share Outcomes</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>If there&apos;s been a vote or decision, share the outcome with participants — they deserve to know their effort mattered</li>
                    <li>If the fight continues, share what&apos;s next and rally for the next round of action</li>
                    <li>Thank everyone who participated — publicly and privately</li>
                    <li>Document what worked and what didn&apos;t for your next campaign</li>
                    <li>Consider starting a new campaign for the next phase of the issue</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Metrics That Matter */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              Metrics That Matter
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-6">
              <p>
                Your campaign dashboard gives you data. But which numbers actually matter, and what should you aim for? Here are the key metrics to watch, with specific benchmarks to guide your strategy.
              </p>

              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Conversion Rate</h3>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">What it is:</strong> The percentage of people who visit your campaign page and actually take action.</p>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">Good benchmark:</strong> 15-30% is strong for advocacy campaigns. If you&apos;re below 10%, your page may need work — revisit your headline and description to make the ask clearer and the urgency more apparent.</p>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">How to improve:</strong> Make sure the first sentence of your description answers &quot;why should I care?&quot; Reduce friction by keeping the page simple and the ask obvious.</p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Messages per Representative</h3>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">What it is:</strong> How many individual messages each targeted legislator has received from your campaign.</p>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">Good benchmark:</strong> 20-50 messages per representative in a single week is the threshold where congressional offices typically take notice. At the local level (city council, selectboard), the bar is lower — even 10-15 unique messages on the same issue stands out.</p>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">How to improve:</strong> Focus sharing efforts on people who live in districts where your message count is low. If one rep has received 40 messages and another has received 3, direct your outreach geographically.</p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Geographic Coverage</h3>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">What it is:</strong> The number of unique ZIP codes and districts represented by your participants.</p>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">Why it matters:</strong> Messages from diverse ZIP codes prove an issue isn&apos;t limited to one neighborhood or interest group. Legislators are more responsive when they see correspondence from across their entire district.</p>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">How to improve:</strong> When sharing, think about reaching different communities within the district. Post in neighborhood-specific groups, share with contacts in different parts of town, and ask participants to forward to friends in other ZIP codes.</p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Sharing Momentum</h3>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">What it is:</strong> The rate of new participants per day — are actions accelerating, steady, or declining?</p>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">Good benchmark:</strong> A healthy campaign sees a spike on launch day, a dip, and then a second wave driven by shares and media coverage. If you&apos;re getting 5+ new participants per day, your campaign has strong organic momentum.</p>
                  <p className="text-sm"><strong className="text-gray-900 dark:text-white">How to improve:</strong> Post milestone updates to reignite interest. Each update is a new opportunity for people to share your campaign with their own networks.</p>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">When Metrics Plateau</h3>
                <p className="text-sm">
                  Every campaign hits a point where growth slows. This is normal. Here&apos;s what to do:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong className="text-gray-900 dark:text-white">Try a new channel</strong> — If you&apos;ve only shared on social media, try email. If you&apos;ve only done online outreach, mention it at an in-person gathering.</li>
                  <li><strong className="text-gray-900 dark:text-white">Refresh your message</strong> — Share a new angle, a participant&apos;s story, or a recent news development related to the issue.</li>
                  <li><strong className="text-gray-900 dark:text-white">Ask for shares, not just actions</strong> — Sometimes the best thing a supporter can do is forward your campaign to three friends.</li>
                  <li><strong className="text-gray-900 dark:text-white">Set a deadline</strong> — &quot;We need 25 more messages by Thursday&quot; creates a concrete reason for people to act now instead of later.</li>
                  <li><strong className="text-gray-900 dark:text-white">Partner with an organization</strong> — Reach out to a local nonprofit, advocacy group, or community organization that cares about the issue. Their endorsement and distribution list can unlock a whole new audience.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Tell Your Story: Make Your Message Stand Out
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
            Ready to start your campaign?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create a campaign page in minutes and rally your community to take action.
          </p>
          <Link
            href="/campaign/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Start a Campaign
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
