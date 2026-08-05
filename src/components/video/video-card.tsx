'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import type { Video } from '@/lib/api/types';
import {
  cn,
  formatDuration,
  formatRelativeTime,
  formatViews,
  getChannelInitial,
  getChannelLabel,
} from '@/lib/utils';
import { prefetchVideoBySlug } from '@/lib/video-cache';
import { markVideoAutoplayIntent } from '@/lib/video-autoplay';
import { AdminVideoEditButton } from '@/components/admin/admin-video-edit-button';
import { VideoOwnerActions } from '@/components/video/video-owner-actions';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useIsVideoOwner } from '@/hooks/use-is-video-owner';

interface VideoCardProps {
  video: Video;
  adminEditable?: boolean;
  onVideoUpdated?: (video: Video) => void;
  badge?: string;
  compact?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export function VideoCard({
  video,
  adminEditable = false,
  onVideoUpdated,
  badge,
  compact = false,
  layout = 'vertical',
}: VideoCardProps) {
  const isAdmin = useIsAdmin();
  const isOwner = useIsVideoOwner(video);
  const queryClient = useQueryClient();
  const showAdminActions = adminEditable && isAdmin;
  const showOwnerActions = isOwner && !showAdminActions;
  const channel = getChannelLabel(video);
  const channelInitial = getChannelInitial(channel);

  const prefetchWatch = () => prefetchVideoBySlug(queryClient, video.slug);

  const thumbnail = (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-xl bg-yt-surface ring-1 ring-yt-border/60 transition duration-300 group-hover:ring-yt-border group-focus-within:ring-neutral-500',
        layout === 'horizontal' ? 'aspect-video w-40 sm:w-56' : 'aspect-video w-full',
      )}
    >
      {video.thumbnailUrl ? (
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          unoptimized
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes={
            layout === 'horizontal'
              ? '224px'
              : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
          }
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-yt-surface text-xs text-yt-text-tertiary">
          No thumbnail
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {badge && (
        <span className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          {badge}
        </span>
      )}

      {video.duration != null && video.duration > 0 && (
        <span className="absolute bottom-2 right-2 rounded-md bg-black/85 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
          {formatDuration(video.duration)}
        </span>
      )}
    </div>
  );

  const metadata = (
    <div className={cn('min-w-0 flex-1', layout === 'vertical' && 'mt-3')}>
      <div className="flex gap-3">
        {layout === 'vertical' && (
          <div className="pro-avatar mt-0.5 h-9 w-9 shrink-0 text-xs" aria-hidden>
            {channelInitial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'line-clamp-2 font-medium leading-snug tracking-tight text-white transition-colors group-hover:text-neutral-100',
              compact ? 'text-[13px]' : 'text-sm',
            )}
          >
            {video.title}
          </h3>
          <p
            className={cn(
              'mt-1 truncate text-yt-text-secondary',
              compact ? 'text-xs' : 'text-xs sm:text-[13px]',
            )}
          >
            {channel}
          </p>
          <p
            className={cn(
              'truncate text-yt-text-tertiary',
              compact ? 'text-[11px]' : 'text-xs sm:text-[13px]',
            )}
          >
            {formatViews(video.views)} views · {formatRelativeTime(video.createdAt)}
          </p>
        </div>
        {(showAdminActions || showOwnerActions) && (
          <div className="shrink-0 self-start opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            {showAdminActions ? (
              <AdminVideoEditButton
                video={video}
                iconOnly
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-yt-text-secondary hover:bg-yt-hover hover:text-white"
                onUpdated={onVideoUpdated}
              />
            ) : (
              <VideoOwnerActions video={video} compact onUpdated={onVideoUpdated} />
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <article className="group relative">
      <Link
        href={`/watch/${video.slug}`}
        prefetch
        className={cn('block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white/20', layout === 'horizontal' && 'flex gap-3')}
        onPointerDown={() => {
          markVideoAutoplayIntent(video.slug);
          prefetchWatch();
        }}
        onMouseEnter={prefetchWatch}
        onFocus={prefetchWatch}
        onTouchStart={prefetchWatch}
      >
        {thumbnail}
        {metadata}
      </Link>
    </article>
  );
}
