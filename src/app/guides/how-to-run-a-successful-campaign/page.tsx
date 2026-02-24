import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Run a Successful Campaign | My Democracy',
  description: 'Learn how to create a compelling advocacy campaign that rallies others to contact their representatives. Tips on headlines, descriptions, messaging, sharing, and tracking success.',
  keywords: ['advocacy campaign', 'grassroots campaign', 'civic engagement', 'contact congress', 'collective action', 'campaign tips'],
  openGraph: {
    title: 'How to Run a Successful Campaign | My Democracy',
    description: 'Learn how to create a compelling advocacy campaign that rallies others to contact their representatives.',
    type: 'article',
    url: 'https://mydemocracy.app/guides/how-to-run-a-successful-campaign',
  },
};

export default function CampaignGuidePage() {
  return (
    <div className="py-12 px-4">
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
