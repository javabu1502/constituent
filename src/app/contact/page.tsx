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
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Write to Your Elected Officials
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          We&apos;ll help you find the people who represent you and send them a message about what matters to you.
        </p>
      </div>
      <Suspense>
        <ContactFlow />
      </Suspense>
    </div>
  );
}
