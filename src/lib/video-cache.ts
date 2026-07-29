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

let warmVideoEl: HTMLVideoElement | null = null;

function getWarmVideoElement(): HTMLVideoElement | null {
  if (typeof document === 'undefined') return null;
  if (!warmVideoEl) {
    warmVideoEl = document.createElement('video');
    warmVideoEl.preload = 'auto';
    warmVideoEl.muted = true;
    warmVideoEl.playsInline = true;
    warmVideoEl.setAttribute('playsinline', 'true');
    warmVideoEl.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none';
    document.body.appendChild(warmVideoEl);
  }
  return warmVideoEl;
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

/** Hint the browser to open a connection and fetch the start of the MP4. */
export function primeVideoStream(url: string): void {
  if (!url || typeof document === 'undefined') return;

  const streamKey = getStreamKey(url);

  const existing = document.querySelector(`link[data-video-prime="${streamKey}"]`);
  if (!existing) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = url;
    link.setAttribute('data-video-prime', streamKey);
    document.head.appendChild(link);
  }

  const warm = getWarmVideoElement();
  if (warm && warm.getAttribute('data-stream-key') !== streamKey) {
    warm.src = url;
    warm.setAttribute('data-stream-key', streamKey);
    warm.load();
  }
}
