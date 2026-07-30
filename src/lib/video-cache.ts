import type { QueryClient } from '@tanstack/react-query';
import { videosApi } from '@/lib/api';
import type { PaginatedResponse, Video } from '@/lib/api/types';

function hasPlaybackUrl(video: Video): boolean {
  return Boolean(video.cdnUrl || (video.qualities && video.qualities.length > 0));
}

/** Stable identity for signed stream URLs (ignore changing query params). */
export function getStreamKey(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

/** Hint the browser to prefetch stream metadata (avoid a second full download). */
export function primeVideoStream(url: string): void {
  if (!url || typeof document === 'undefined') return;

  const streamKey = getStreamKey(url);

  const existing = document.querySelector(`link[data-video-prime="${streamKey}"]`);
  if (existing) return;

  try {
    const origin = new URL(url).origin;
    if (!document.querySelector(`link[data-video-preconnect="${origin}"]`)) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = origin;
      preconnect.crossOrigin = 'anonymous';
      preconnect.setAttribute('data-video-preconnect', origin);
      document.head.appendChild(preconnect);
    }
  } catch {
    // ignore invalid URL
  }

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'fetch';
  link.href = url;
  link.crossOrigin = 'anonymous';
  link.setAttribute('data-video-prime', streamKey);
  document.head.appendChild(link);
}

/** Reuse list/search cache so the watch page can render the player before the watch API returns. */
export function findVideoInCache(queryClient: QueryClient, slug: string): Video | undefined {
  const listQueries = queryClient.getQueriesData<PaginatedResponse<Video>>({
    queryKey: ['videos'],
  });
  for (const [, data] of listQueries) {
    const found = data?.data?.find((v) => v.slug === slug);
    if (found && hasPlaybackUrl(found)) return found;
  }

  const searchQueries = queryClient.getQueriesData<PaginatedResponse<Video>>({
    queryKey: ['search'],
  });
  for (const [, data] of searchQueries) {
    const found = data?.data?.find((v) => v.slug === slug);
    if (found && hasPlaybackUrl(found)) return found;
  }

  for (const key of ['trending', 'latest'] as const) {
    const limits = queryClient.getQueriesData<Video[]>({ queryKey: ['videos', key] });
    for (const [, data] of limits) {
      const found = data?.find((v) => v.slug === slug);
      if (found && hasPlaybackUrl(found)) return found;
    }
  }

  return undefined;
}

export function prefetchVideoBySlug(queryClient: QueryClient, slug: string): void {
  const cached = findVideoInCache(queryClient, slug);
  const streamUrl =
    cached?.cdnUrl ?? cached?.qualities?.find((q) => q.url)?.url ?? cached?.qualities?.[0]?.url;
  if (streamUrl) {
    primeVideoStream(streamUrl);
  }

  void queryClient.prefetchQuery({
    queryKey: ['video', slug],
    queryFn: () => videosApi.getBySlug(slug),
    staleTime: 5 * 60 * 1000,
  });
}
