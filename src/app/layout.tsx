import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react"
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
