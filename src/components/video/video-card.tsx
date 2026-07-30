'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import type { Video } from '@/lib/api/types';
import { cn, formatDuration, formatUploadLabel, formatViews } from '@/lib/utils';
import { prefetchVideoBySlug } from '@/lib/video-cache';
import { markVideoAutoplayIntent } from '@/lib/video-autoplay';
import { AdminVideoEditButton } from '@/components/admin/admin-video-edit-button';
import { useIsAdmin } from '@/hooks/use-is-admin';

interface VideoCardProps {
  video: Video;
  adminEditable?: boolean;
  onVideoUpdated?: (video: Video) => void;
  badge?: string;
  compact?: boolean;
}

export function VideoCard({
  video,
  adminEditable = false,
  onVideoUpdated,
  badge,
  compact = false,
}: VideoCardProps) {
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const showAdminActions = adminEditable && isAdmin;

  const prefetchWatch = () => prefetchVideoBySlug(queryClient, video.slug);

  return (
    <div className="group relative">
      <Link
        href={`/watch/${video.slug}`}
        prefetch
        className="block"
        onPointerDown={() => {
          markVideoAutoplayIntent(video.slug);
          prefetchWatch();
        }}
        onMouseEnter={prefetchWatch}
        onFocus={prefetchWatch}
        onTouchStart={prefetchWatch}
      >
        <div
          className={cn(
            'relative aspect-video overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-zinc-800 transition-all',
            'group-hover:ring-red-500/30 group-active:scale-[0.99]',
          )}
        >
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 72vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              No thumbnail
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />

          {badge && (
            <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-200 backdrop-blur-sm">
              {badge}
            </span>
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/95 text-white shadow-lg sm:h-11 sm:w-11">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </div>
          </div>

          {video.duration != null && video.duration > 0 && (
            <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
        <div className={cn('mt-2.5 space-y-1 px-0.5', compact && 'mt-2')}>
          <h3
            className={cn(
              'line-clamp-2 font-semibold leading-snug text-white transition-colors group-hover:text-red-400',
              compact ? 'text-[13px]' : 'text-sm sm:text-[15px]',
            )}
          >
            {video.title}
          </h3>
          <p className={cn('text-zinc-500', compact ? 'text-[11px]' : 'text-xs sm:text-sm')}>
            {formatViews(video.views)} views
            {' · '}
            {formatUploadLabel(video.createdAt)}
          </p>
        </div>
      </Link>

      {showAdminActions && (
        <div className="absolute right-2 top-2 z-10">
          <AdminVideoEditButton
            video={video}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-md border border-zinc-700/80 bg-black/75 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm hover:border-red-500/50"
            onUpdated={onVideoUpdated}
          />
        </div>
      )}
    </div>
  );
}
