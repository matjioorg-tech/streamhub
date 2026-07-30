import type { QueryClient } from '@tanstack/react-query';
import { videosApi } from '@/lib/api';
import type { PaginatedResponse, Video } from '@/lib/api/types';

const CDN_ORIGIN = 'https://media.telnewstreams.dpdns.org';

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

function hintCdnConnection(url: string): void {
  if (typeof document === 'undefined') return;

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
}

/** Warm CDN connection only — avoid fetch preload competing with the video element. */
export function primeVideoStream(url: string): void {
  if (!url || typeof document === 'undefined') return;
  hintCdnConnection(url);
  hintCdnConnection(CDN_ORIGIN);
}

/** MKV/MKV mislabeled uploads — browsers cannot decode in `<video>`. */
export function isBrowserIncompatibleVideo(video: Pick<Video, 'mimeType'>): boolean {
  const mime = video.mimeType?.toLowerCase() ?? '';
  return (
    mime.includes('matroska') ||
    mime.includes('mpegts') ||
    mime.includes('x-msvideo')
  );
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

  const watchCached = queryClient.getQueryData<Video>(['video', slug]);
  if (watchCached && hasPlaybackUrl(watchCached)) return watchCached;

  return undefined;
}

export function prefetchVideoBySlug(queryClient: QueryClient, slug: string): void {
  primeVideoStream(CDN_ORIGIN);

  void queryClient.prefetchQuery({
    queryKey: ['video', slug],
    queryFn: () => videosApi.getBySlug(slug),
    staleTime: 0,
  });
}
