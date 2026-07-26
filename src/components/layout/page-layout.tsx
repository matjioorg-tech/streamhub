'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';
import { cn } from '@/lib/utils';

export function PageLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const isWatchPage = pathname.startsWith('/watch/');

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className={cn(
          'mx-auto w-full max-w-7xl flex-1',
          isWatchPage ? 'px-0 py-0 pb-4 md:px-6 md:py-6' : 'px-4 py-5 pb-24 md:px-6 md:py-6 md:pb-8',
          className,
        )}
      >
        {children}
      </main>
      <Footer />
      {!isWatchPage && <MobileNav />}
    </div>
  );
}
