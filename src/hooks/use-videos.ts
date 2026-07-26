'use client';

import { useQuery } from '@tanstack/react-query';
import { videosApi, type VideoQueryParams } from '@/lib/api';

export function useVideos(params?: VideoQueryParams) {
  return useQuery({
    queryKey: ['videos', params],
    queryFn: () => videosApi.list(params),
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
  return useQuery({
    queryKey: ['video', slug],
    queryFn: () => videosApi.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useSearchVideos(params: VideoQueryParams) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => videosApi.search(params),
    enabled: !!params.search,
  });
}
