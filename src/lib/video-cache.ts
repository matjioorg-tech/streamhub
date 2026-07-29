import type { QueryClient } from '@tanstack/react-query';
import { videosApi } from '@/lib/api';
import type { PaginatedResponse, Video } from '@/lib/api/types';

function hasPlaybackUrl(video: Video): boolean {
  return Boolean(video.cdnUrl || (video.qualities && video.qualities.length > 0));
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
  void queryClient.prefetchQuery({
    queryKey: ['video', slug],
    queryFn: () => videosApi.getBySlug(slug),
    staleTime: 5 * 60 * 1000,
  });
}
