'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Film,
  HardDrive,
  Key,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Upload,
  X,
} from 'lucide-react';
import { adminApi, authApi } from '@/lib/api';
import type { User } from '@/lib/api/types';
import {
  clearSession,
  getAccessToken,
  getScopedUserId,
  getStoredUser,
  isAdminUser,
  setScopedUserId,
  storeUser,
} from '@/lib/auth/session';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/admin', label: 'Dashboard', exact: true, icon: LayoutDashboard },
  { href: '/admin/videos', label: 'Videos', icon: Film },
  { href: '/admin/uploads', label: 'Uploads', icon: Upload },
  { href: '/admin/storage-keys', label: 'Storage Keys', icon: Key },
  { href: '/admin/terabox', label: 'TeraBox', icon: HardDrive },
  { href: '/admin/invitations', label: 'Invitations', icon: Mail },
];

function AdminUserPicker() {
  const queryClient = useQueryClient();
  const currentUser = getStoredUser();
  const [selectedUserId, setSelectedUserId] = useState(
    () => getScopedUserId() ?? currentUser?.id ?? '',
  );

  const { data: users = [] } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.listUsers(),
  });

  useEffect(() => {
    if (!selectedUserId && currentUser?.id) {
      setScopedUserId(currentUser.id);
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser?.id, selectedUserId]);

  const handleChange = (userId: string) => {
    setSelectedUserId(userId);
    setScopedUserId(userId);
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  };

  if (users.length === 0) return null;

  return (
    <label className="flex w-full flex-col gap-1 lg:w-auto lg:flex-row lg:items-center">
      <span className="text-xs text-zinc-500">Viewing as</span>
      <select
        value={selectedUserId}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full max-w-none truncate rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white lg:max-w-[200px]"
      >
        {users.map((user: User) => (
          <option key={user.id} value={user.id}>
            {user.displayName} ({user.email})
          </option>
        ))}
      </select>
    </label>
  );
}

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
          {navLinks.map(({ href, label, exact, icon: Icon }) => {
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
          <div className="hidden lg:block">
            <AdminUserPicker />
          </div>
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
            className="fixed inset-0 z-40 bg-black/70 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <nav className="fixed inset-x-0 top-[calc(3.25rem+env(safe-area-inset-top))] bottom-0 z-50 flex flex-col overflow-y-auto bg-zinc-950 px-4 py-4 pb-[env(safe-area-inset-bottom)] md:hidden">
            {user && (
              <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Signed in as</p>
                <p className="mt-1 truncate text-sm font-medium text-white">{user.email}</p>
              </div>
            )}
            <div className="mb-4 lg:hidden">
              <AdminUserPicker />
            </div>
            <div className="flex flex-col gap-1">
              {navLinks.map(({ href, label, exact, icon: Icon }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-red-950/40 text-white ring-1 ring-red-900/50'
                        : 'text-zinc-300 active:bg-zinc-800/60',
                    )}
                  >
                    <Icon
                      className={cn('h-5 w-5 shrink-0', active ? 'text-red-400' : 'text-zinc-500')}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-auto flex items-center gap-3 rounded-xl border border-zinc-700 px-4 py-3.5 text-left text-sm text-zinc-300 active:bg-zinc-800"
            >
              <LogOut className="h-5 w-5 shrink-0 text-zinc-500" />
              Logout
            </button>
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
        if (!getScopedUserId()) {
          setScopedUserId(user.id);
        }
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
      <main className="mx-auto max-w-7xl px-3 py-4 pb-[env(safe-area-inset-bottom)] sm:px-4 sm:py-5 md:py-6">
        {children}
      </main>
    </div>
  );
}
