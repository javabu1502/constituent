import { ContactFlow } from '@/components/contact/ContactFlow';

export const metadata = {
  title: 'Contact Your Representatives | My Democracy',
  description: 'Find your federal and state representatives and send them a personalized message or make a phone call. AI writes the perfect message for you.',
};

export default function ContactPage() {
  return (
    <div className="py-8 px-4">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Contact Your Representatives
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Follow the steps below to find your representatives and send them a message.
        </p>
      </div>
      <ContactFlow />
    </div>
  );
}
