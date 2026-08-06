'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/categories', label: 'Home', icon: Home, match: (p: string) => p === '/categories' || p.startsWith('/categories/') },
  { href: '/search', label: 'Browser', icon: Compass, match: (p: string) => p.startsWith('/search') },
  { href: '/profile', label: 'Profile', icon: User, match: (p: string) => p.startsWith('/profile') },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-sm items-stretch justify-around rounded-2xl border border-yt-border/70 bg-yt-surface/90 px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors',
                active ? 'text-white' : 'text-yt-text-tertiary',
              )}
            >
              {active && (
                <span className="absolute inset-x-3 top-1 h-8 rounded-lg bg-accent-muted" />
              )}
              <Icon
                className={cn('relative h-5 w-5 shrink-0', active && 'text-accent')}
                strokeWidth={active ? 2.25 : 2}
              />
              <span className="relative truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
