'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileMenuDrawer } from '@/components/layout/mobile-menu-drawer';
import { SidebarProvider } from '@/components/layout/sidebar-context';
import { AppGuard } from '@/components/auth/app-guard';
import { cn } from '@/lib/utils';

function PageLayoutInner({
  children,
  className,
  hideMobileNav = false,
  hideFooter = false,
}: {
  children: React.ReactNode;
  className?: string;
  hideMobileNav?: boolean;
  hideFooter?: boolean;
}) {
  const pathname = usePathname();
  const isWatchPage = pathname.startsWith('/watch/');
  const showMobileNav = !hideMobileNav && !isWatchPage;

  return (
    <div className="flex min-h-screen flex-col bg-yt-bg">
      <Header />
      <MobileMenuDrawer />
      <div className="flex flex-1 pt-14">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main
            className={cn(
              'mx-auto w-full flex-1',
              isWatchPage
                ? 'max-w-[1754px] px-0 py-0 pb-4 lg:px-6 lg:py-4'
                : showMobileNav
                  ? 'px-4 py-4 pb-28 lg:px-6 lg:pb-6'
                  : 'px-4 py-4 lg:px-6',
              className,
            )}
          >
            <AppGuard>{children}</AppGuard>
          </main>
          {!hideFooter && !isWatchPage && <Footer compact={showMobileNav} />}
        </div>
      </div>
      {showMobileNav && <MobileNav />}
    </div>
  );
}

export function PageLayout(props: {
  children: React.ReactNode;
  className?: string;
  hideMobileNav?: boolean;
  hideFooter?: boolean;
}) {
  return (
    <SidebarProvider>
      <PageLayoutInner {...props} />
    </SidebarProvider>
  );
}
