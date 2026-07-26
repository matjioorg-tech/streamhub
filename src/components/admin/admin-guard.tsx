'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  isAdminUser,
  setSession,
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
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4">
        <Link href="/admin" className="text-lg font-bold text-red-500">
          StreamHub Admin
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
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
        <div className="ml-auto flex items-center gap-3">
          {user && (
            <span className="hidden text-sm text-zinc-500 sm:inline">{user.email}</span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Logout
          </button>
        </div>
      </div>
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
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
