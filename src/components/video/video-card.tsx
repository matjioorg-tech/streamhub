'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Video } from '@/lib/api/types';
import { formatDuration, formatViews } from '@/lib/utils';
import { AdminVideoEditButton } from '@/components/admin/admin-video-edit-button';
import { useIsAdmin } from '@/hooks/use-is-admin';

interface VideoCardProps {
  video: Video;
  adminEditable?: boolean;
  onVideoUpdated?: (video: Video) => void;
}

export function VideoCard({ video, adminEditable = false, onVideoUpdated }: VideoCardProps) {
  const isAdmin = useIsAdmin();
  const showAdminActions = adminEditable && isAdmin;

  return (
    <div className="group relative">
      <Link href={`/watch/${video.slug}`} className="block">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-zinc-800 transition-all group-hover:ring-zinc-700">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              No thumbnail
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          {video.duration != null && video.duration > 0 && (
            <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
        <div className="mt-2.5 space-y-1 px-0.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-red-400 sm:text-[15px]">
            {video.title}
          </h3>
          <p className="text-xs text-zinc-500 sm:text-sm">
            {formatViews(video.views)} views
            {video.publishedAt && (
              <> &middot; {new Date(video.publishedAt).toLocaleDateString()}</>
            )}
          </p>
        </div>
      </Link>

      {showAdminActions && (
        <div className="absolute right-2 top-2 z-10">
          <AdminVideoEditButton
            video={video}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-700/80 bg-black/75 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:border-red-500/50"
            onUpdated={onVideoUpdated}
          />
        </div>
      )}
    </div>
  );
}
