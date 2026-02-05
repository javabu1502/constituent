import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-purple-50 via-purple-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your voice matters.
            <br />
            <span className="text-purple-600">Make it heard.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Contact your elected representatives — federal and state — with a
            personalized, AI-crafted message in minutes.
          </p>
          <Link href="/contact">
            <Button size="lg" className="text-lg px-8 py-4">
              Contact Your Reps
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Three simple steps to make your voice heard
          </p>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">📍</span>
              </div>
              <div className="text-sm font-medium text-purple-600 mb-2">Step 1</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Enter your address
              </h3>
              <p className="text-gray-600 leading-relaxed">
                We find your federal and state representatives — 2 U.S. Senators,
                1 U.S. Representative, plus your state legislators.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">💬</span>
              </div>
              <div className="text-sm font-medium text-purple-600 mb-2">Step 2</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Tell us what you care about
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Describe the issue in your own words. AI writes a personalized,
                compelling letter for each representative.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">✉️</span>
              </div>
              <div className="text-sm font-medium text-purple-600 mb-2">Step 3</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Send it
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Email your message directly to their staff with one click per
                representative. Your message lands in their inbox.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes This Different Section */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
            What Makes This Different
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Not a form letter
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Every message is unique, written by AI based on YOUR words and
                perspective. No copy-paste campaigns.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Federal AND state
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Contact all 5 of your legislators at once — U.S. Senators, U.S.
                Representative, state senator, and state assembly member.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Staffers read these
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Congressional offices tally every constituent message. Your email
                gets logged and counted — it genuinely matters.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Your personal story matters most
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Share why this issue affects you personally. Stories from real
                constituents are what move legislators to act.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your Privacy, Protected
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Your address is used only to find your representatives and is never
            stored. Messages are generated on-the-fly and not retained. We
            don&apos;t sell data. Ever.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 bg-purple-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to be heard?
          </h2>
          <p className="text-purple-100 mb-8 text-lg">
            Your representatives work for you. Let them know what matters.
          </p>
          <Link href="/contact">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-purple-600 hover:bg-purple-50 border-white text-lg px-8"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-gray-400 text-sm">
                My Democracy &copy; 2026
              </span>
            </div>
            <Link
              href="/contact"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Contact Your Reps
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
