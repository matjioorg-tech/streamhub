'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, User, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/trending', label: 'Trending' },
  { href: '/latest', label: 'Latest' },
  { href: '/categories', label: 'Categories' },
];

export function Header() {
  const pathname = usePathname();
  const isWatchPage = pathname.startsWith('/watch/');

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur',
        isWatchPage && 'md:block',
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:gap-6">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-red-500">
          StreamHub
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm transition-colors',
                pathname === href
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/search"
            className="rounded-full p-2.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/admin/login"
            className="hidden rounded-full p-2.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white sm:block"
            aria-label="Admin"
          >
            <LayoutDashboard className="h-5 w-5" />
          </Link>
          <Link
            href="/profile"
            className="rounded-full p-2.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Profile"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
