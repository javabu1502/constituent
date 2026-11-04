import { Suspense } from 'react';
import { ContactFlow } from '@/components/contact/ContactFlow';

export const metadata = {
  title: 'Write to Your Elected Officials | My Democracy',
  description: 'Find the people who represent you in government and send them a message. AI helps you write it.',
  alternates: {
    canonical: 'https://www.mydemocracy.app/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="py-8 px-4">
      <div className="max-w-3xl mx-auto mb-10">
        <p className="label mb-3">Write a letter</p>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter leading-[0.96] text-gray-900 dark:text-white mb-5">
          Say it in your own words.
        </h1>
        <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 max-w-[58ch]">
          We find the people who represent you, help you write what you actually mean, and deliver it. You see every
          word before anything is sent.
        </p>
      </div>
      <Suspense>
        <ContactFlow />
      </Suspense>
    </div>
  );
}
