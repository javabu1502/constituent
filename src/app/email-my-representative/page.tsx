import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd, FaqJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Email My Representative | Find Yours and Write to Them | My Democracy',
  description: 'Find the US Representative for your address and send them a message. Delivered to the office through the official congressional system.',
  keywords: ["email my representative", "email my congressman", "how to email my representative", "contact my representative", "write to my representative", "message my congressman"],
  alternates: { canonical: 'https://www.mydemocracy.app/email-my-representative' },
  openGraph: { title: 'Email My Representative | Find Yours and Write to Them | My Democracy', description: 'Find the US Representative for your address and send them a message. Delivered to the office through the official congressional system.', type: 'website' },
};

export default function Page() {
  return (
    <div className="py-12 px-4">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Email your US Representative', href: '/email-my-representative' }]} />
      <FaqJsonLd
        items={[
          {
            question: 'How do I email your US Representative?',
            answer: 'Enter your address, see the member of the House who represents you, and write to them. The message goes to the office through the official congressional system rather than to a general inbox.',
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
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Email your US Representative</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Enter your address, see the member of the House who represents you, and write to them. The message goes to the office through the official congressional system rather than to a general inbox.</p>

        <div className="mt-8">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-base font-semibold text-white hover:bg-purple-700 transition-colors"
          >
            Find your US Representative and write
          </Link>
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900 dark:text-white">How it works</h2>
        <ol className="mt-4 space-y-3 text-gray-700 dark:text-gray-300 list-decimal list-inside">
          <li>Enter your street address. It is used to work out who represents you.</li>
          <li>Pick who to write to. You will see your US Representative.</li>
          <li>Write in your own words. You can start from a draft and change any of it.</li>
          <li>Send. We tell you what happened to the message, including if it did not get through.</li>
        </ol>

        <h2 className="mt-10 text-xl font-bold text-gray-900 dark:text-white">What to know</h2>
        <p className="mt-3 text-gray-700 dark:text-gray-300">Every address in the country sits in one congressional district, and a representative&apos;s office only accepts mail from the people in theirs. That is why the address matters, and why a message sent to the wrong office goes nowhere.</p>

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
