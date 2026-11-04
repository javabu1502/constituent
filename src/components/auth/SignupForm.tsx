'use client';

import Link from 'next/link';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { EmailCodeForm } from '@/components/auth/EmailCodeForm';

export function SignupForm() {
  return (
    <div className="space-y-4">
      <GoogleSignInButton label="Sign up with Google" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface dark:bg-gray-800 text-gray-500 dark:text-gray-400">or</span>
        </div>
      </div>

      <EmailCodeForm mode="signup" redirectTo="/dashboard" />

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-purple-700 dark:text-purple-300 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
