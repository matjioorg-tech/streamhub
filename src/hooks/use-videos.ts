'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { videosApi, type VideoQueryParams } from '@/lib/api';
import { findVideoInCache, getVideoStreamUrl } from '@/lib/video-cache';

export function useVideos(params?: VideoQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['videos', params],
    queryFn: () => videosApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useTrendingVideos(limit = 20) {
  return useQuery({
    queryKey: ['videos', 'trending', limit],
    queryFn: () => videosApi.trending(limit),
  });
}

export function useLatestVideos(limit = 20) {
  return useQuery({
    queryKey: ['videos', 'latest', limit],
    queryFn: () => videosApi.latest(limit),
  });
}

export function useVideo(slug: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['video', slug],
    queryFn: () => videosApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: 45 * 60 * 1000,
    // Skip ~6s watch API round-trip when list/trending cache already has a signed stream URL.
    refetchOnMount: (query) => {
      const cached = findVideoInCache(queryClient, slug);
      if (cached && getVideoStreamUrl(cached)) return false;
      const current = query.state.data;
      return !(current && getVideoStreamUrl(current));
    },
    placeholderData: () => findVideoInCache(queryClient, slug),
  });
}

export function useNearbyVideos(slug: string, limit = 8) {
  return useQuery({
    queryKey: ['video', slug, 'nearby', limit],
    queryFn: () => videosApi.nearby(slug, limit),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchVideos(params: VideoQueryParams) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => videosApi.search(params),
    enabled: !!(params.search || params.category || params.subCategory),
  });
}
