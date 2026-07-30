import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import type { Video } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { VideoCard } from './video-card';

interface VideoGridProps {
  videos: Video[];
  title?: string;
  subtitle?: string;
  href?: string;
  icon?: LucideIcon;
  adminEditable?: boolean;
  onVideoUpdated?: (video: Video) => void;
  layout?: 'grid' | 'row';
}

export function VideoGrid({
  videos,
  title,
  subtitle,
  href,
  icon: Icon,
  adminEditable = false,
  onVideoUpdated,
  layout = 'grid',
}: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 py-14 text-center text-sm text-zinc-500">
        No videos found.
      </div>
    );
  }

  return (
    <section>
      {(title || href) && (
        <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
          <div className="flex min-w-0 items-start gap-2.5">
            {Icon && (
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 ring-1 ring-zinc-800 sm:h-9 sm:w-9">
                <Icon className="h-4 w-4 text-red-400" />
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h2 className="text-base font-semibold text-white sm:text-lg">{title}</h2>
              )}
              {subtitle && (
                <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 sm:text-sm">{subtitle}</p>
              )}
            </div>
          </div>
          {href && (
            <Link
              href={href}
              className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 sm:text-sm"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {layout === 'row' ? (
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scroll-smooth scrollbar-none sm:-mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {videos.map((video) => (
            <div key={video.id} className="w-[68vw] max-w-[280px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink">
              <VideoCard
                video={video}
                adminEditable={adminEditable}
                onVideoUpdated={onVideoUpdated}
                compact
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              adminEditable={adminEditable}
              onVideoUpdated={onVideoUpdated}
              compact
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
  icon: Icon,
}: {
  title: string;
  layout?: 'grid' | 'row';
  icon?: LucideIcon;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5 sm:mb-4">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 animate-pulse rounded-lg bg-zinc-800 sm:h-9 sm:w-9" />
        )}
        <h2 className="text-base font-semibold text-white sm:text-lg">{title}</h2>
      </div>
      <div
        className={cn(
          layout === 'row'
            ? '-mx-4 flex gap-2.5 overflow-hidden px-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:px-0 lg:grid-cols-4'
            : 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4',
        )}
      >
        {Array.from({ length: layout === 'row' ? 4 : 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse space-y-2',
              layout === 'row' && 'w-[68vw] max-w-[280px] shrink-0 sm:w-auto sm:max-w-none',
            )}
          >
            <div className="aspect-video rounded-xl bg-zinc-800" />
            <div className="h-3.5 w-4/5 rounded bg-zinc-800" />
            <div className="h-3 w-1/2 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </section>
  );
}
