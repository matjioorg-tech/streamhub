'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  Flame,
  Grid3X3,
  Heart,
  History,
  Home,
  Upload,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';

const mainLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/trending', label: 'Trending', icon: Flame },
  { href: '/latest', label: 'Latest', icon: Clock },
  { href: '/categories', label: 'Explore', icon: Grid3X3 },
];

const libraryLinks = [
  { href: '/history', label: 'History', icon: History },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/profile/videos', label: 'Your videos', icon: Upload },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center gap-4 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
        active
          ? 'bg-yt-hover text-white'
          : 'text-yt-text-secondary hover:bg-yt-hover/70 hover:text-white',
        collapsed && 'justify-center px-2',
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
      )}
      <Icon
        className={cn(
          'h-[22px] w-[22px] shrink-0 transition-colors',
          active ? 'text-white' : 'text-yt-text-secondary group-hover:text-white',
        )}
        strokeWidth={active ? 2.25 : 2}
      />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  const collapsed = !open;
  const isWatchPage = pathname.startsWith('/watch/');

  if (isWatchPage) {
    return null;
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}

      <aside
        className={cn(
          'z-50 flex shrink-0 flex-col overflow-hidden border-r border-yt-border/80 bg-yt-bg transition-[width,transform] duration-200 ease-out',
          'fixed left-0 top-0 h-full pt-[calc(3.5rem+env(safe-area-inset-top))]',
          'lg:relative lg:top-auto lg:z-30 lg:h-auto lg:min-h-[calc(100vh-3.5rem)] lg:translate-x-0 lg:pt-0',
          open ? 'w-[240px] translate-x-0' : 'w-0 -translate-x-full lg:w-[72px] lg:translate-x-0',
        )}
      >
        <nav className="flex h-full w-[240px] flex-col overflow-y-auto overflow-x-hidden px-2.5 py-3 scrollbar-none lg:w-full">
          <div className="space-y-0.5">
            {mainLinks.map((link) => (
              <NavItem
                key={link.href}
                {...link}
                active={isActive(link.href)}
                collapsed={collapsed}
              />
            ))}
          </div>

          {!collapsed && (
            <p className="mb-1.5 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-yt-text-tertiary">
              Library
            </p>
          )}
          {collapsed && <div className="my-3 border-t border-yt-border/80" />}

          <div className="space-y-0.5">
            {libraryLinks.map((link) => (
              <NavItem
                key={link.href}
                {...link}
                active={isActive(link.href)}
                collapsed={collapsed}
              />
            ))}
            <NavItem
              href="/profile"
              label="Profile"
              icon={User}
              active={pathname === '/profile'}
              collapsed={collapsed}
            />
          </div>
        </nav>
      </aside>
    </>
  );
}
