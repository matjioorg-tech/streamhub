import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'StreamHub - Video Streaming Platform',
  description: 'Watch and discover videos',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const B2_ORIGIN = 'https://s3.us-east-005.backblazeb2.com';
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1').origin;
  } catch {
    return undefined;
  }
})();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        <link rel="dns-prefetch" href={B2_ORIGIN} />
        <link rel="preconnect" href={B2_ORIGIN} crossOrigin="" />
        {API_ORIGIN && API_ORIGIN !== B2_ORIGIN ? (
          <>
            <link rel="dns-prefetch" href={API_ORIGIN} />
            <link rel="preconnect" href={API_ORIGIN} crossOrigin="" />
          </>
        ) : null}
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
