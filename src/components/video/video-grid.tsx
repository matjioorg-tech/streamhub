import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Video } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { VideoCard } from './video-card';

interface VideoGridProps {
  videos: Video[];
  title?: string;
  subtitle?: string;
  href?: string;
  adminEditable?: boolean;
  onVideoUpdated?: (video: Video) => void;
  layout?: 'grid' | 'row';
}

export function VideoGrid({
  videos,
  title,
  subtitle,
  href,
  adminEditable = false,
  onVideoUpdated,
  layout = 'grid',
}: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center text-zinc-500">
        No videos found.
      </div>
    );
  }

  return (
    <section>
      {(title || href) && (
        <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">{subtitle}</p>
            )}
          </div>
          {href && (
            <Link
              href={href}
              className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-red-400 transition-colors hover:text-red-300"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {layout === 'row' ? (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory scrollbar-none sm:-mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {videos.map((video) => (
            <div key={video.id} className="w-[72vw] shrink-0 snap-start sm:w-auto sm:shrink">
              <VideoCard
                video={video}
                adminEditable={adminEditable}
                onVideoUpdated={onVideoUpdated}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              adminEditable={adminEditable}
              onVideoUpdated={onVideoUpdated}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function VideoGridSkeleton({
  title,
  layout = 'grid',
}: {
  title: string;
  layout?: 'grid' | 'row';
}) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-white sm:mb-5 sm:text-xl">{title}</h2>
      <div
        className={cn(
          layout === 'row'
            ? '-mx-4 flex gap-3 overflow-hidden px-4 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4'
            : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        )}
      >
        {Array.from({ length: layout === 'row' ? 4 : 4 }).map((_, i) => (
          <div
            key={i}
            className={cn('animate-pulse space-y-2', layout === 'row' && 'w-[72vw] shrink-0 sm:w-auto')}
          >
            <div className="aspect-video rounded-xl bg-zinc-800" />
            <div className="h-4 w-3/4 rounded bg-zinc-800" />
            <div className="h-3 w-1/2 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </section>
  );
}
