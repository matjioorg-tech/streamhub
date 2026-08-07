'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  {
    href: '/categories',
    label: 'Home',
    icon: Home,
    match: (p: string) => p === '/' || p === '/categories' || p.startsWith('/categories/'),
  },
  {
    href: '/search',
    label: 'Search',
    icon: Search,
    match: (p: string) => p.startsWith('/search'),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: User,
    match: (p: string) => p.startsWith('/profile'),
  },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      aria-label="Main navigation"
    >
      {/* Soft fade so content doesn't clash with the bar */}
      <div
        className="pointer-events-none h-6 bg-gradient-to-t from-yt-bg to-transparent"
        aria-hidden
      />

      <div className="border-t border-yt-border/80 bg-yt-bg/98 backdrop-blur-2xl supports-[backdrop-filter]:bg-yt-bg/90">
        <div className="mx-auto flex h-[3.75rem] max-w-lg items-stretch px-1 pb-[env(safe-area-inset-bottom)]">
          {links.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 transition-colors active:opacity-80',
                  active ? 'text-white' : 'text-yt-text-tertiary',
                )}
              >
                {active && (
                  <span
                    className="absolute inset-x-4 top-1.5 h-9 rounded-xl bg-accent-muted"
                    aria-hidden
                  />
                )}
                <Icon
                  className={cn(
                    'relative h-[22px] w-[22px] shrink-0 transition-colors',
                    active ? 'text-accent' : 'text-yt-text-secondary',
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'relative max-w-full truncate text-[11px] leading-none tracking-wide',
                    active ? 'font-semibold text-white' : 'font-medium',
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
