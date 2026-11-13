import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Email My Senator | Find Yours and Write to Them | My Democracy',
  description: 'Find both US Senators for your state and send them a message. Most Senate offices accept constituent mail through the official congressional system.',
  keywords: ["email my senator", "how to email my senator", "contact my senator", "write to my senator", "email senator", "message my senator"],
  alternates: { canonical: 'https://www.mydemocracy.app/email-my-senator' },
  openGraph: { title: 'Email My Senator | Find Yours and Write to Them | My Democracy', description: 'Find both US Senators for your state and send them a message. Most Senate offices accept constituent mail through the official congressional system.', type: 'website' },
};

export default function Page() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Email your US Senators', href: '/email-my-senator' }]} />
      <FaqJsonLd
        items={[
          {
            question: 'How do I email your US Senators?',
            answer: 'Enter your address, see both Senators for your state, and write to them. Where the office takes part, the message goes through the official congressional system.',
          },
          {
            question: 'Do I have to give my address?',
            answer: 'Yes. A congressional or legislative office only accepts mail from the people it represents, and the address is how an office knows you are one of them. It is also how we work out which officials are yours.',
          },
          {
            question: 'Does writing actually do anything?',
            answer: 'Offices sort constituent mail by issue and count positions, and those counts reach the member. A short message in your own words, naming where you live and what you want done, is counted as one constituent position. An identical copy of a form letter is counted once across everyone who sent it.',
          },
        ]}
      />

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Email your US Senators</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Enter your address, see both Senators for your state, and write to them. Where the office takes part, the message goes through the official congressional system.</p>

        <div className="mt-8">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-base font-semibold text-white hover:bg-purple-700 transition-colors"
          >
            Find both of your US Senators and write
          </Link>
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900 dark:text-white">How it works</h2>
        <ol className="mt-4 space-y-3 text-gray-700 dark:text-gray-300 list-decimal list-inside">
          <li>Enter your street address. It is used to work out who represents you.</li>
          <li>Pick who to write to. You will see both of your US Senators.</li>
          <li>Write in your own words. You can start from a draft and change any of it.</li>
          <li>Send. We tell you what happened to the message, including if it did not get through.</li>
        </ol>

        <h2 className="mt-10 text-xl font-bold text-gray-900 dark:text-white">What to know</h2>
        <p className="mt-3 text-gray-700 dark:text-gray-300">Not every Senate office accepts constituent mail electronically through the official system. We checked all of them, and where an office is not on it we fall back to the route that office does publish.</p>

        <h2 className="mt-10 text-xl font-bold text-gray-900 dark:text-white">Related</h2>
        <ul className="mt-3 space-y-2 text-gray-700 dark:text-gray-300">
          <li><Link href="/representatives" className="text-purple-600 dark:text-purple-400 hover:underline">See everyone who represents your address</Link></li>
          <li><Link href="/guides/write-effective-letter-to-congress" className="text-purple-600 dark:text-purple-400 hover:underline">How to write a letter an office will read</Link></li>
          <li><Link href="/research/how-hard-is-it-to-contact-your-legislature" className="text-purple-600 dark:text-purple-400 hover:underline">We checked whether you can actually reach your legislature</Link></li>
        </ul>
      </div>
    </div>
  );
}
