'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Film } from 'lucide-react';
import type { PlaylistDetail } from '@/lib/api/types';
import { cn, formatRelativeTime } from '@/lib/utils';

export function BatchVideoRow({
  video,
  index,
}: {
  video: PlaylistDetail['videos'][number];
  index: number;
}) {
  const canWatch = video.status === 'published' || video.status === 'ready';

  return (
    <tr className="border-b border-yt-border hover:bg-yt-hover/40">
      <td className="py-3 pr-3 text-sm text-yt-text-secondary">{index + 1}</td>
      <td className="py-3 pr-3">
        <Link
          href={canWatch ? `/watch/${video.slug}` : '#'}
          className={cn(
            'relative block aspect-video w-28 overflow-hidden rounded-lg bg-yt-hover',
            !canWatch && 'pointer-events-none opacity-60',
          )}
        >
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              unoptimized
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Film className="h-5 w-5 text-yt-text-secondary" />
            </div>
          )}
        </Link>
      </td>
      <td className="py-3 pr-3">
        <Link
          href={canWatch ? `/watch/${video.slug}` : '#'}
          className={cn('font-medium text-yt-text hover:text-white', !canWatch && 'pointer-events-none')}
        >
          {video.title}
        </Link>
        <p className="mt-1 text-xs capitalize text-yt-text-secondary">{video.status}</p>
      </td>
      <td className="hidden py-3 text-sm text-yt-text-secondary md:table-cell">
        {formatRelativeTime(video.createdAt)}
      </td>
    </tr>
  );
}
