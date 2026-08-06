'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import { Menu, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';
import { getStoredUser } from '@/lib/auth/session';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggle, open } = useSidebar();
  const [query, setQuery] = useState('');
  const user = getStoredUser();
  const isWatchPage = pathname.startsWith('/watch/');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-[60] flex h-14 items-center gap-2 border-b border-yt-border/80 bg-yt-bg/90 px-2 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl sm:gap-4 sm:px-4',
        isWatchPage && 'bg-yt-bg/95',
      )}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={toggle}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-yt-hover active:scale-95 lg:hidden"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/categories" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-rose-700 shadow-sm">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-white" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="hidden truncate text-[17px] font-semibold tracking-tight text-white sm:inline">
            StreamHub
          </span>
        </Link>
      </div>

      <form
        onSubmit={handleSearch}
        className="mx-auto hidden min-w-0 max-w-[680px] flex-1 items-center sm:flex"
      >
        <div className="flex w-full items-center overflow-hidden rounded-full border border-yt-border-input bg-yt-surface shadow-inner transition-colors focus-within:border-neutral-500 focus-within:ring-2 focus-within:ring-white/5">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos, creators, topics…"
            className="h-10 min-w-0 flex-1 border-0 bg-transparent px-4 text-sm text-white placeholder:text-yt-text-tertiary focus:outline-none"
          />
          <button
            type="submit"
            className="flex h-10 w-14 shrink-0 items-center justify-center border-l border-yt-border-input bg-yt-hover text-yt-text-secondary transition-colors hover:bg-yt-border hover:text-white"
            aria-label="Search"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
        </div>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Link
          href="/search"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-yt-hover sm:hidden"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Link>

        <Link
          href="/profile"
          className="pro-avatar flex h-9 w-9 text-xs ring-1 ring-yt-border transition hover:ring-neutral-500"
          aria-label="Profile"
        >
          {user?.displayName ? (
            <span className="uppercase">{user.displayName.slice(0, 1)}</span>
          ) : (
            <User className="h-4 w-4 text-yt-text-secondary" />
          )}
        </Link>
      </div>
    </header>
  );
}
