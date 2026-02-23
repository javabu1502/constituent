import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | My Democracy',
  description: 'Terms of service for using My Democracy to contact your elected representatives.',
};

export default function TermsPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Terms of Service
        </h1>
        <p className="text-gray-500 mb-10">
          Last updated: February 2026
        </p>

        <div className="prose prose-gray max-w-none">
          {/* Using My Democracy */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Using My Democracy
            </h2>
            <div className="space-y-3 text-gray-600 pl-10">
              <p>
                My Democracy helps you contact your elected representatives at the
                federal and state level. By using our service, you agree to the following:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-gray-900">Provide accurate information.</strong> Use
                  your real name and real address. Representatives need to verify you&apos;re
                  actually their constituent.
                </li>
                <li>
                  <strong className="text-gray-900">Messages are sent on your behalf.</strong> When
                  you click send, your message goes to real government officials and their staff.
                </li>
                <li>
                  <strong className="text-gray-900">You are responsible for your messages.</strong> You
                  review and approve every message before it&apos;s sent. The content is yours.
                </li>
              </ul>
            </div>
          </section>

          {/* Prohibited Uses */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </span>
              Prohibited Uses
            </h2>
            <div className="space-y-3 text-gray-600 pl-10">
              <p>You may not use My Democracy to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-gray-900">Threaten, harass, or abuse</strong> officials,
                  their staff, or anyone else
                </li>
                <li>
                  <strong className="text-gray-900">Impersonate other people</strong> or
                  misrepresent your identity
                </li>
                <li>
                  <strong className="text-gray-900">Use bots or automation</strong> without
                  our explicit permission
                </li>
                <li>
                  <strong className="text-gray-900">Send spam</strong> or mass duplicate messages
                </li>
                <li>
                  <strong className="text-gray-900">Engage in illegal activity</strong> of any kind
                </li>
              </ul>
              <p className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                Violations may result in immediate termination of access. Threats against
                government officials may be reported to appropriate authorities.
              </p>
            </div>
          </section>

          {/* AI-Generated Content */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              AI-Generated Content
            </h2>
            <div className="space-y-3 text-gray-600 pl-10">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Our AI helps draft messages based on what you tell us about the issue
                  and your perspective
                </li>
                <li>
                  <strong className="text-gray-900">You review and can edit</strong> all
                  messages before they&apos;re sent
                </li>
                <li>
                  <strong className="text-gray-900">You are responsible</strong> for the
                  final content you choose to send
                </li>
                <li>
                  AI suggestions are <strong className="text-gray-900">not legal, medical,
                  or professional advice</strong>
                </li>
              </ul>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              Disclaimer
            </h2>
            <div className="space-y-3 text-gray-600 pl-10">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                <p>
                  <strong className="text-yellow-800">No guarantee of delivery.</strong>{' '}
                  <span className="text-yellow-700">
                    Officials may have spam filters, full inboxes, or other systems that
                    could prevent your message from being received.
                  </span>
                </p>
                <p>
                  <strong className="text-yellow-800">Not a government service.</strong>{' '}
                  <span className="text-yellow-700">
                    We are not affiliated with any government agency, elected official,
                    or political party.
                  </span>
                </p>
                <p>
                  <strong className="text-yellow-800">No guarantee of response.</strong>{' '}
                  <span className="text-yellow-700">
                    We cannot guarantee that any official will read, respond to, or take
                    action based on your message.
                  </span>
                </p>
                <p>
                  <strong className="text-yellow-800">Service provided &quot;as is.&quot;</strong>{' '}
                  <span className="text-yellow-700">
                    We provide this service without warranty of any kind, express or implied.
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              Privacy
            </h2>
            <div className="space-y-3 text-gray-600 pl-10">
              <p>
                Your privacy matters to us. For details on how we handle your data,
                please see our{' '}
                <Link href="/privacy" className="text-purple-600 hover:underline font-medium">
                  Privacy Policy
                </Link>.
              </p>
              <p>
                The short version: we don&apos;t store your address or messages,
                and we never sell your data.
              </p>
            </div>
          </section>

          {/* Changes */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </span>
              Changes to These Terms
            </h2>
            <div className="space-y-3 text-gray-600 pl-10">
              <p>
                We may update these terms from time to time. We&apos;ll update the
                &quot;Last updated&quot; date at the top of this page when we do.
              </p>
              <p>
                Continued use of My Democracy after changes means you accept the
                new terms.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              Contact
            </h2>
            <div className="space-y-3 text-gray-600 pl-10">
              <p>
                Questions about these terms?
              </p>
              <p>
                Email us at{' '}
                <a href="mailto:info@mydemocracy.app" className="text-purple-600 hover:underline">
                  info@mydemocracy.app
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
