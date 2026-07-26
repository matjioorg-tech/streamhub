const USER_KEY = 'user';

export interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setSession(
  tokens: { accessToken: string; refreshToken: string },
  user: StoredUser,
): void {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function storeUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem(USER_KEY);
}

export function isAdminUser(user: StoredUser | null): boolean {
  return user?.role === 'admin';
}
