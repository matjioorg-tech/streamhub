'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { authApi } from '@/lib/api';
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  isAdminUser,
  storeUser,
} from '@/lib/auth/session';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/videos', label: 'Videos' },
  { href: '/admin/uploads', label: 'Uploads' },
  { href: '/admin/storage-keys', label: 'Storage Keys' },
  { href: '/admin/terabox', label: 'TeraBox' },
  { href: '/admin/invitations', label: 'Invitations' },
];

function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear local session anyway
    }
    clearSession();
    router.replace('/admin/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:py-4">
        <Link href="/admin" className="shrink-0 text-lg font-bold text-red-500">
          StreamHub Admin
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white',
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <span className="hidden max-w-[140px] truncate text-sm text-zinc-500 lg:inline">
              {user.email}
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="hidden rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 md:block"
          >
            Logout
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 top-[calc(3.25rem+env(safe-area-inset-top))] z-40 bg-black/60 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <nav className="relative z-50 border-t border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map(({ href, label, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                      active
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800/60',
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 rounded-lg border border-zinc-700 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Logout
              </button>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  const isInvitePage = pathname.startsWith('/admin/invite/');
  const isPublicAdminPage = isLoginPage || isInvitePage;
  const [ready, setReady] = useState(isPublicAdminPage);

  useEffect(() => {
    if (isLoginPage) {
      const token = getAccessToken();
      const user = getStoredUser();
      if (token && isAdminUser(user)) {
        router.replace('/admin');
      } else {
        setReady(true);
      }
      return;
    }

    if (isInvitePage) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function verify() {
      const token = getAccessToken();
      if (!token) {
        router.replace('/admin/login');
        return;
      }

      try {
        const user = await authApi.me();
        if (user.role !== 'admin') {
          clearSession();
          router.replace('/admin/login');
          return;
        }
        storeUser(user);
        if (!cancelled) setReady(true);
      } catch {
        clearSession();
        router.replace('/admin/login');
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [isLoginPage, isInvitePage, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading...
      </div>
    );
  }

  if (isPublicAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AdminNav />
      <main className="mx-auto max-w-7xl px-4 py-5 pb-[env(safe-area-inset-bottom)] md:py-6">
        {children}
      </main>
    </div>
  );
}
