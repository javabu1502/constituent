'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { EmailCodeForm } from '@/components/auth/EmailCodeForm';

export function LoginForm() {
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirectTo') || '/dashboard';
  // Prevent open redirect — only allow relative paths
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard';

  return (
    <div className="space-y-4">
      <GoogleSignInButton redirectTo={redirectTo} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface dark:bg-gray-800 text-gray-500 dark:text-gray-400">or</span>
        </div>
      </div>

      <EmailCodeForm mode="signin" redirectTo={redirectTo} />

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        New here? Entering your email signs you up too.{' '}
        <Link href="/signup" className="text-purple-700 dark:text-purple-300 hover:underline font-medium">
          Add your details
        </Link>
      </p>
    </div>
  );
}
