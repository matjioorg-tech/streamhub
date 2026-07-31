import type { QueryClient } from '@tanstack/react-query';
import { videosApi } from '@/lib/api';
import type { PaginatedResponse, Video } from '@/lib/api/types';

const CDN_ORIGIN = 'https://media.telnewstreams.dpdns.org';
/** First init segment + moov — enough to prime without competing with the main player. */
const RANGE_WARM_BYTES = 512 * 1024;

function hasPlaybackUrl(video: Video): boolean {
  return Boolean(video.cdnUrl || (video.qualities && video.qualities.length > 0));
}

export function getVideoStreamUrl(video: Video): string | null {
  return (
    video.cdnUrl ??
    video.qualities?.find((q) => q.url)?.url ??
    video.qualities?.[0]?.url ??
    null
  );
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

const rangeWarmed = new Set<string>();
const warmElements = new Map<string, { el: HTMLVideoElement; timer: ReturnType<typeof setTimeout> }>();

function prefetchRange(url: string, streamKey: string): void {
  if (rangeWarmed.has(streamKey)) return;
  rangeWarmed.add(streamKey);

  void fetch(url, {
    method: 'GET',
    headers: { Range: `bytes=0-${RANGE_WARM_BYTES - 1}` },
    mode: 'cors',
    credentials: 'omit',
    priority: 'low',
  }).catch(() => {
    rangeWarmed.delete(streamKey);
  });
}

/** Hidden `<video>` — metadata only so it doesn't compete with the main player download. */
function primeMediaElement(url: string, streamKey: string): void {
  if (warmElements.has(streamKey)) return;

  const el = document.createElement('video');
  el.preload = 'metadata';
  el.muted = true;
  el.playsInline = true;
  el.setAttribute('playsinline', '');
  el.setAttribute('webkit-playsinline', '');
  el.style.cssText =
    'position:fixed;width:0;height:0;opacity:0;pointer-events:none;left:-9999px;top:-9999px';
  el.src = url;
  document.body.appendChild(el);

  const timer = setTimeout(() => {
    el.remove();
    warmElements.delete(streamKey);
  }, 90_000);

  warmElements.set(streamKey, { el, timer });
}

/** Take over a pre-warmed element so buffered bytes aren't thrown away. */
export function adoptWarmVideo(url: string): HTMLVideoElement | null {
  const streamKey = getStreamKey(url);
  const session = warmElements.get(streamKey);
  if (!session) return null;

  clearTimeout(session.timer);
  warmElements.delete(streamKey);
  session.el.removeAttribute('style');
  session.el.preload = 'auto';
  session.el.muted = false;
  return session.el;
}

/** Detach warm session but keep fetching so HTTP cache stays hot for the player. */
export function releaseWarmVideo(url: string): void {
  const streamKey = getStreamKey(url);
  const session = warmElements.get(streamKey);
  if (!session) return;
  warmElements.delete(streamKey);
  clearTimeout(session.timer);
  session.timer = setTimeout(() => {
    session.el.remove();
  }, 15_000);
}

/** Preconnect + parallel range prefetch — call on card tap/hover. */
export function warmVideoStream(url: string): void {
  if (!url || typeof document === 'undefined') return;

  hintCdnConnection(url);
  hintCdnConnection(CDN_ORIGIN);

  const streamKey = getStreamKey(url);
  prefetchRange(url, streamKey);
}

/** @deprecated Use warmVideoStream */
export function primeVideoStream(url: string): void {
  warmVideoStream(url);
}

/** MKV mislabeled uploads — browsers cannot decode in `<video>`. */
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
  const cached = findVideoInCache(queryClient, slug);
  const streamUrl = cached ? getVideoStreamUrl(cached) : null;
  if (streamUrl) {
    warmVideoStream(streamUrl);
  } else {
    hintCdnConnection(CDN_ORIGIN);
  }

  void queryClient.prefetchQuery({
    queryKey: ['video', slug],
    queryFn: () => videosApi.getBySlug(slug),
    staleTime: 45 * 60 * 1000,
  });
}
