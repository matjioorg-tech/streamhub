'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play, Sparkles } from 'lucide-react';
import type { Video } from '@/lib/api/types';
import { formatDuration, formatUploadLabel, formatViews } from '@/lib/utils';
import { markVideoAutoplayIntent } from '@/lib/video-autoplay';

interface FeaturedVideoCardProps {
  video: Video;
}

export function FeaturedVideoCard({ video }: FeaturedVideoCardProps) {
  return (
    <Link
      href={`/watch/${video.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 ring-1 ring-zinc-800 transition-all hover:border-red-500/30 hover:ring-red-500/20"
      onPointerDown={() => markVideoAutoplayIntent(video.slug)}
    >
      <div className="relative aspect-[16/10] sm:aspect-[21/9]">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-500">
            No thumbnail
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />

        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          <Sparkles className="h-3 w-3" />
          Latest upload
        </div>

        {video.duration != null && video.duration > 0 && (
          <span className="absolute right-4 top-4 rounded-md bg-black/75 px-2 py-1 text-xs font-medium tabular-nums text-white backdrop-blur-sm">
            {formatDuration(video.duration)}
          </span>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <div className="flex items-end gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-lg font-bold leading-snug text-white sm:text-2xl lg:text-3xl">
                {video.title}
              </h2>
              <p className="mt-2 text-xs text-zinc-400 sm:text-sm">
                {formatViews(video.views)} views
                {' · '}
                {formatUploadLabel(video.createdAt)}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/40 transition-transform group-hover:scale-105 sm:h-14 sm:w-14">
              <Play className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
