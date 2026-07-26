'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Clock, Grid3X3, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/trending', label: 'Trending', icon: Flame },
  { href: '/latest', label: 'Latest', icon: Clock },
  { href: '/categories', label: 'Browse', icon: Grid3X3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-red-400' : 'text-zinc-500',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-red-500')} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
