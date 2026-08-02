'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import { clearSession, getAccessToken, storeUser } from '@/lib/auth/session';

const PUBLIC_PATHS = ['/login', '/register'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/watch/')) return true;
  return false;
}

export function AppGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = isPublicPath(pathname);
  const [ready, setReady] = useState(isPublic);

  useEffect(() => {
    if (isPublic) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function verify() {
      const token = getAccessToken();
      if (!token) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const user = await authApi.me();
        storeUser(user);
        if (!cancelled) setReady(true);
      } catch {
        clearSession();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    }

    setReady(false);
    verify();
    return () => {
      cancelled = true;
    };
  }, [isPublic, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-zinc-400">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
