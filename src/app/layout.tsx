import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react"
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChatProvider } from '@/components/chat/ChatProvider';
import { ChatButton } from '@/components/chat/ChatButton';
import { ChatPanel } from '@/components/chat/ChatPanel';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mydemocracy.app'),
  title: 'My Democracy | Know Your Reps, Track Legislation, Take Action',
  description:
    'Find and contact your federal and state representatives in minutes. Write personalized messages with AI assistance. Free, private, no account needed.',
  keywords: ['civic engagement', 'contact representatives', 'democracy', 'AI', 'congress', 'state legislature'],
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: 'https://www.mydemocracy.app/',
  },
  openGraph: {
    title: 'My Democracy | Know Your Reps, Track Legislation, Take Action',
    description:
      'Find and contact your federal and state representatives in minutes. Write personalized messages with AI assistance. Free, private, no account needed.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Democracy | Know Your Reps, Track Legislation, Take Action',
    description:
      'Find and contact your federal and state representatives in minutes. Write personalized messages with AI assistance.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white dark:bg-gray-900`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <ChatProvider>
          <Header />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <ChatPanel />
          <ChatButton />
        </ChatProvider>
        <Analytics />
      </body>
    </html>
  );
}
