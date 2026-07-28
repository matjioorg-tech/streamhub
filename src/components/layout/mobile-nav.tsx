'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Clock, Grid3X3, Home, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/trending', label: 'Trending', icon: Flame },
  { href: '/latest', label: 'Latest', icon: Clock },
  { href: '/categories', label: 'Browse', icon: Grid3X3 },
  { href: '/search', label: 'Search', icon: Search },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors',
                active ? 'text-red-400' : 'text-zinc-500',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active && 'text-red-500')} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
