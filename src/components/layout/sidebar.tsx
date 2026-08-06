'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid3X3, Heart, History, Upload, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';

const mainLinks = [{ href: '/categories', label: 'Browse', icon: Grid3X3 }];

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

/** Desktop sidebar only — mobile uses `MobileMenuDrawer`. */
export function Sidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const collapsed = !open;
  const isWatchPage = pathname.startsWith('/watch/');

  if (isWatchPage) {
    return null;
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col overflow-hidden border-r border-yt-border/80 bg-yt-bg transition-[width] duration-200 ease-out lg:flex',
        open ? 'w-[240px]' : 'w-[72px]',
      )}
    >
      <nav className="flex h-full min-h-[calc(100vh-3.5rem)] w-full flex-col overflow-y-auto overflow-x-hidden px-2.5 py-3 scrollbar-none">
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
  );
}
