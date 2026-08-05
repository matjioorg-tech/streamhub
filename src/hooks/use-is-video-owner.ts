'use client';

import { getStoredUser } from '@/lib/auth/session';
import type { Video } from '@/lib/api/types';

export function isVideoOwner(video: Video | null | undefined, userId?: string | null): boolean {
  if (!video?.userId || !userId) return false;
  return video.userId === userId;
}

export function useIsVideoOwner(video: Video | null | undefined): boolean {
  const user = getStoredUser();
  return isVideoOwner(video, user?.id);
}
