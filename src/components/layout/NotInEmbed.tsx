'use client';

import { usePathname } from 'next/navigation';

// The root layout wraps every route with site chrome (header, footer, chat).
// /embed/* pages render inside third-party iframes and must stay bare.
export function NotInEmbed({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/embed/')) return null;
  return <>{children}</>;
}
