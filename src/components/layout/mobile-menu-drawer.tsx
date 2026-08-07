'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Grid3X3,
  Heart,
  History,
  Home,
  Search,
  Upload,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';

const primaryLinks = [
  { href: '/categories', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/profile', label: 'Profile', icon: User },
];

const libraryLinks = [
  { href: '/history', label: 'History', icon: History },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/profile/videos', label: 'Your videos', icon: Upload },
];

function DrawerLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors',
        active
          ? 'bg-accent-muted text-white'
          : 'text-yt-text-secondary hover:bg-yt-hover hover:text-white',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 2} />
      <span>{label}</span>
    </Link>
  );
}

export function MobileMenuDrawer() {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  const close = () => setOpen(false);

  if (pathname.startsWith('/watch/')) {
    return null;
  }

  return (
    <div className="lg:hidden" aria-hidden={!open}>
      <button
        type="button"
        className={cn(
          'fixed inset-0 z-[70] bg-black/70 backdrop-blur-[3px] transition-opacity duration-300 ease-out',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={close}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 z-[80] flex h-full w-[min(88vw,19.5rem)] flex-col border-r border-yt-border/80 bg-yt-bg shadow-[4px_0_32px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform',
          'pt-[calc(3.5rem+env(safe-area-inset-top))]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex items-center justify-between border-b border-yt-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-rose-700">
              <Grid3X3 className="h-4 w-4 text-white" />
            </span>
            <span className="text-sm font-semibold text-white">StreamHub</span>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-yt-text-secondary transition hover:bg-yt-hover hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none">
          <div className="space-y-1">
            {primaryLinks.map((link) => (
              <DrawerLink
                key={link.href}
                {...link}
                active={isActive(link.href)}
                onNavigate={close}
              />
            ))}
          </div>

          <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-yt-text-tertiary">
            Library
          </p>
          <div className="space-y-1">
            {libraryLinks.map((link) => (
              <DrawerLink
                key={link.href}
                {...link}
                active={isActive(link.href)}
                onNavigate={close}
              />
            ))}
          </div>
        </nav>
      </aside>
    </div>
  );
}
