/** Backend origin without trailing slash or /api/v1 suffix. */
export function getConfiguredApiOrigin(): string {
  const raw = (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3000'
  )
    .trim()
    .replace(/\/$/, '');

  return raw.replace(/\/api\/v1\/?$/i, '');
}

/**
 * Browser: same-origin `/api/v1/*` (Next.js rewrite in next.config.ts).
 * Server (SSR/RSC): direct backend URL.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return `${getConfiguredApiOrigin()}/api/v1`;
}
