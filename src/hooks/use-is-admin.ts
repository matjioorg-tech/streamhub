'use client';

import { useEffect, useState } from 'react';
import { getStoredUser, isAdminUser } from '@/lib/auth/session';

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(isAdminUser(getStoredUser()));
  }, []);

  return isAdmin;
}
