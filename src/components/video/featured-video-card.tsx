'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { Play, Sparkles } from 'lucide-react';
import type { Video } from '@/lib/api/types';
import { formatDuration, formatUploadLabel, formatViews } from '@/lib/utils';
import { markVideoAutoplayIntent } from '@/lib/video-autoplay';
import { prefetchVideoBySlug } from '@/lib/video-cache';

interface FeaturedVideoCardProps {
  video: Video;
}

export function FeaturedVideoCard({ video }: FeaturedVideoCardProps) {
  const queryClient = useQueryClient();

  return (
    <Link
      href={`/watch/${video.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900 ring-1 ring-zinc-800/80 transition-all active:scale-[0.995] hover:border-red-500/30 hover:ring-red-500/20"
      onPointerDown={() => {
        markVideoAutoplayIntent(video.slug);
        prefetchVideoBySlug(queryClient, video.slug);
      }}
    >
      <div className="relative aspect-video sm:aspect-[21/9]">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-500">
            No thumbnail
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm sm:left-4 sm:top-4 sm:gap-1.5 sm:px-3 sm:text-[11px]">
          <Sparkles className="h-3 w-3" />
          New
        </div>

        {video.duration != null && video.duration > 0 && (
          <span className="absolute right-3 top-3 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm sm:right-4 sm:top-4 sm:px-2 sm:py-1 sm:text-xs">
            {formatDuration(video.duration)}
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6">
          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-base font-bold leading-snug text-white sm:text-2xl lg:text-3xl">
                {video.title}
              </h2>
              <p className="mt-1 text-[11px] text-zinc-400 sm:mt-2 sm:text-sm">
                {formatViews(video.views)} views · {formatUploadLabel(video.createdAt)}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/40 sm:h-14 sm:w-14">
              <Play className="ml-0.5 h-4 w-4 fill-current sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
