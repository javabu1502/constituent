import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { BRAND } from '@/lib/constants';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="py-20 px-4 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Make Your Voice Heard
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {BRAND.description} Connect with your elected officials and advocate
            for the issues that matter to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="w-full sm:w-auto">
                Contact Your Representatives
              </Button>
            </Link>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                1. Enter Your Address
              </h3>
              <p className="text-gray-600">
                We&apos;ll find your federal representatives based on your location.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                2. Choose Your Topic
              </h3>
              <p className="text-gray-600">
                Select an issue and share your perspective. Add your personal story
                for more impact.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                3. AI Writes Your Message
              </h3>
              <p className="text-gray-600">
                Our AI crafts a personalized, compelling message. Review, edit, and
                send.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 px-4 bg-purple-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-purple-100 mb-8">
            Your representatives work for you. Let them know what matters.
          </p>
          <Link href="/contact">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-purple-600 hover:bg-purple-50 border-white"
            >
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
