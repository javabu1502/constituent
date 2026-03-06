import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'How to Use Social Media to Reach Your Representatives | My Democracy',
  description: 'Learn how to use social media platforms effectively to engage with your elected officials, build coalitions, and amplify your civic advocacy.',
  keywords: ['social media advocacy', 'contact representatives', 'civic engagement', 'online advocacy', 'digital activism', 'tag representatives'],
  openGraph: {
    title: 'How to Use Social Media to Reach Your Representatives | My Democracy',
    description: 'Learn how to use social media platforms effectively to engage with your elected officials, build coalitions, and amplify your civic advocacy.',
    type: 'article',
  },
};

export default function SocialMediaAdvocacyGuidePage() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Guides', href: '/guides' }, { name: 'Social Media Advocacy', href: '/guides/social-media-advocacy' }]} />
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
          How to Use Social Media to Reach Your Representatives
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Social media has become a direct line between constituents and elected officials. Most members of Congress and state legislators maintain active social media accounts, and their communications staff monitor mentions and messages closely. Used well, social media can amplify your voice, build public accountability, and connect you with others who share your concerns.
          </p>

          {/* Why Social Media Matters for Advocacy */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </span>
              Why Social Media Matters for Advocacy
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Legislative offices pay close attention to social media. Public posts that tag a representative create a form of accountability that private emails and phone calls do not. When a constituent&apos;s post gains traction, it signals to the office that an issue has broad community interest.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Social media advocacy works because:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">It&apos;s public</strong>: Unlike emails and phone calls, social media posts are visible to other constituents, journalists, and advocacy organizations. This creates pressure for a response.</li>
                <li><strong className="text-gray-900 dark:text-white">It&apos;s fast</strong>: Social media lets you respond to breaking news, upcoming votes, or policy announcements in real time, when it matters most.</li>
                <li><strong className="text-gray-900 dark:text-white">It&apos;s shareable</strong>: A single post can be amplified by hundreds of people, turning one constituent&apos;s concern into a visible movement.</li>
                <li><strong className="text-gray-900 dark:text-white">Staff monitor it</strong>: Congressional and state legislative offices typically have dedicated communications staff who track social media mentions and report trends to the member.</li>
              </ul>
            </div>
          </section>

          {/* Finding Your Reps on Social Media */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              Finding Your Officials on Social Media
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Before you can engage, you need to find the right accounts. Most elected officials maintain both official government accounts and campaign or personal accounts. The official accounts are the ones monitored by legislative staff.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">How to find official accounts:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Official websites</strong>: Your official&apos;s .gov website typically lists their official social media accounts. For members of Congress, check their page on <a href="https://www.house.gov/representatives" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">house.gov</a> or <a href="https://www.senate.gov/senators/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">senate.gov</a>.</li>
                <li><strong className="text-gray-900 dark:text-white">Verification badges</strong>: Look for verified or official badges on platforms to confirm you&apos;re engaging with the real account.</li>
                <li><strong className="text-gray-900 dark:text-white">My Democracy</strong>: Use our <Link href="/contact" className="text-purple-600 dark:text-purple-400 hover:underline">representative lookup tool</Link> to find your elected officials and their contact information.</li>
              </ul>
              <p>
                <strong className="text-gray-900 dark:text-white">Important distinction:</strong> Official accounts (often labeled &quot;Rep.&quot; or &quot;Sen.&quot;) are managed by government staff and subject to record-keeping rules. Campaign accounts are managed by political staff. Both are worth following, but your advocacy messages will carry more weight when directed at official accounts.
              </p>
            </div>
          </section>

          {/* Crafting Effective Posts */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
              Crafting Effective Posts
            </h2>
            <div className="pl-10 space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                An effective advocacy post is concise, specific, and personal. Legislative communications staff process a high volume of social media mentions. Posts that are clear and actionable are the ones that get logged and reported to the member.
              </p>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Structure Your Post</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li><strong className="text-gray-900 dark:text-white">Tag the official account</strong>: Always include your official&apos;s handle so the post appears in their mentions.</li>
                  <li><strong className="text-gray-900 dark:text-white">Identify yourself as a constituent</strong>: Mention your city, district, or state. This immediately signals that you&apos;re a voter who matters to them.</li>
                  <li><strong className="text-gray-900 dark:text-white">State the issue clearly</strong>: Name the bill, vote, or policy in plain language.</li>
                  <li><strong className="text-gray-900 dark:text-white">Make a specific ask</strong>: &quot;Vote yes on...&quot; or &quot;Co-sponsor...&quot; or &quot;Hold a town hall on...&quot; is far more effective than &quot;do something about...&quot;</li>
                  <li><strong className="text-gray-900 dark:text-white">Add a personal detail</strong>: One sentence about how this issue affects you personally makes the post memorable.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Example Posts</h3>
                <div className="space-y-3">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                    <span className="text-green-600 dark:text-green-400">Effective:</span> &quot;@RepSmith I&apos;m a small business owner in Springfield. The proposed changes to SBA loan terms would directly affect my ability to keep my 8 employees. Please protect small business lending programs. #SmallBusiness&quot;
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                    <span className="text-green-600 dark:text-green-400">Effective:</span> &quot;@SenJones As a veteran in your district, I&apos;m asking you to support funding for VA mental health services. I waited 3 months for my first appointment. Our veterans deserve better.&quot;
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Platform-Specific Tips</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li><strong className="text-gray-900 dark:text-white">X (Twitter)</strong>: Keep posts focused on one issue. Tag the official account. Use relevant hashtags to extend reach beyond your followers. Quote-posting your official&apos;s own statements with a respectful response can be effective.</li>
                  <li><strong className="text-gray-900 dark:text-white">Facebook</strong>: Comment on your official&apos;s official page posts. Longer comments with personal stories tend to perform well. Sharing their posts with your own commentary reaches your network.</li>
                  <li><strong className="text-gray-900 dark:text-white">Instagram</strong>: Visual content performs best. A photo of you at a town hall, in your community, or a simple text graphic with your message can be powerful. Use stories to tag representatives directly.</li>
                  <li><strong className="text-gray-900 dark:text-white">Video</strong>: Short video messages (under 60 seconds) where you look into the camera and tell your story are among the most compelling content on any platform. They&apos;re hard to ignore and easy to share.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Building a Coalition Online */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              Building a Coalition Online
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Individual posts matter, but coordinated advocacy from multiple constituents is far more powerful. When a legislative office sees the same issue raised by many different people in their district, it signals genuine community concern rather than a single voice.
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Strategies for building collective advocacy:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Coordinate posting days</strong>: Organize with neighbors, friends, or advocacy groups to all post about the same issue on the same day. A surge of constituent posts on a single topic is hard for staff to ignore.</li>
                <li><strong className="text-gray-900 dark:text-white">Share templates, not scripts</strong>: Give people talking points and structure, but encourage them to write in their own words and share their own experiences. Identical copy-paste messages are easily identified and carry less weight.</li>
                <li><strong className="text-gray-900 dark:text-white">Engage local groups</strong>: Connect with neighborhood associations, parent groups, professional organizations, or faith communities who share your concerns. These groups often have existing social media followings.</li>
                <li><strong className="text-gray-900 dark:text-white">Amplify each other</strong>: Share and respond to other constituents&apos; posts. When representatives see a thread of real people from their district discussing an issue, it carries significant weight.</li>
                <li><strong className="text-gray-900 dark:text-white">Create a shared hashtag</strong>: A district-specific or issue-specific hashtag helps organize the conversation and makes it easy for the representative&apos;s staff to track the volume of concern.</li>
              </ul>
              <p>
                Remember: the goal is to demonstrate that real constituents in the district care about an issue. Authenticity matters far more than volume. Ten genuine personal posts from district residents will have more impact than a thousand identical messages from accounts outside the district.
              </p>
            </div>
          </section>

          {/* What Doesn't Work */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </span>
              What Doesn&apos;t Work
            </h2>
            <div className="pl-10 text-gray-600 dark:text-gray-300 space-y-4">
              <p>
                Not all social media engagement is effective advocacy. Some approaches can actively undermine your goals. Legislative staff are experienced at distinguishing genuine constituent engagement from noise.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-gray-900 dark:text-white">Personal attacks and insults</strong>: Hostile messages are dismissed, and on many platforms they may be hidden or filtered. Anger is understandable, but disrespectful posts give staff an easy reason to disregard your message. Firm and direct is more effective than aggressive.</li>
                <li><strong className="text-gray-900 dark:text-white">Copy-paste campaigns</strong>: When hundreds of people post the exact same text, staff recognize it as an organized campaign and may discount it. Form letters carry less weight than personal messages. Use talking points as a starting framework, but write your own words.</li>
                <li><strong className="text-gray-900 dark:text-white">Posting without identifying as a constituent</strong>: If your official&apos;s staff can&apos;t tell you live in their district, your post may not be counted. Always mention your city, state, or district.</li>
                <li><strong className="text-gray-900 dark:text-white">Engaging only once</strong>: A single post is easy to overlook. Sustained engagement over time, commenting on relevant posts, following up on votes, asking for updates, shows that you are a committed constituent who is paying attention.</li>
                <li><strong className="text-gray-900 dark:text-white">Spreading misinformation</strong>: Inaccurate claims undermine your credibility. Before posting, verify your facts using official government sources like <a href="https://www.congress.gov" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Congress.gov</a> or your state legislature&apos;s website. If you make a mistake, correct it publicly.</li>
                <li><strong className="text-gray-900 dark:text-white">Threatening language</strong>: Any language that could be interpreted as a threat is taken extremely seriously. It can result in your message being reported to law enforcement rather than logged as constituent feedback. Stick to civil, issue-focused communication.</li>
              </ul>
              <p>
                The most effective social media advocates are the ones who show up consistently, communicate respectfully, make specific asks, and demonstrate that they are informed, engaged constituents who vote.
              </p>
            </div>
          </section>

          {/* Related Guides */}
          <section className="mb-10 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Related Guides</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/guides/tell-your-story" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Tell Your Story: Effective Advocacy Through Personal Stories
                </Link>
              </li>
              <li>
                <Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Write an Effective Letter to Congress
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-run-a-successful-campaign" className="text-purple-600 dark:text-purple-400 hover:underline">
                  How to Run a Successful Campaign
                </Link>
              </li>
            </ul>
          </section>
        </div>

        {/* CTA Section */}
        <div className="mt-10 bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Ready to Make Your Voice Heard?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Find your officials and craft a message that gets their attention, online or off.
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
