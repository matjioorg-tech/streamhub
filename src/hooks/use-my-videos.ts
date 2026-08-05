'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videosApi } from '@/lib/api';
import type { UpdateVideoInput } from '@/lib/api/types';

export function useUpdateMyVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVideoInput }) =>
      videosApi.updateVideo(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
    },
  });
}

export function useDeleteMyVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => videosApi.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
    },
  });
}

export function useRetryMyVideoUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => videosApi.retryUpload(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
    },
  });
}
