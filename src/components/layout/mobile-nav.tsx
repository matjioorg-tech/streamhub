'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid3X3, Heart, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/categories', label: 'Browse', icon: Grid3X3 },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favorites', label: 'Saved', icon: Heart },
  { href: '/profile', label: 'You', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-yt-border/80 bg-yt-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href === '/favorites' && pathname.startsWith('/favorites')) ||
            (href === '/profile' && pathname.startsWith('/profile')) ||
            (href !== '/' && href !== '/profile' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors',
                active ? 'text-white' : 'text-yt-text-tertiary',
              )}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />
              )}
              <Icon className="h-6 w-6 shrink-0" strokeWidth={active ? 2.25 : 2} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
