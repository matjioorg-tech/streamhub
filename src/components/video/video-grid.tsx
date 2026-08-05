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
      <div className="pro-empty">
        <p className="text-sm text-yt-text-secondary">No videos found.</p>
      </div>
    );
  }

  return (
    <section>
      {(title || href) && (
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-5 w-5 shrink-0 text-yt-text-tertiary" />}
              {title && <h2 className="pro-section-title">{title}</h2>}
            </div>
            {subtitle && <p className="pro-section-subtitle">{subtitle}</p>}
          </div>
          {href && (
            <Link
              href={href}
              className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-yt-text-secondary transition hover:text-white"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {layout === 'row' ? (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <div key={video.id} className="w-[78vw] max-w-[320px] shrink-0 sm:w-auto sm:max-w-none">
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
        <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      <div className="mb-5 flex items-center gap-2">
        {Icon && <span className="h-5 w-5 animate-pulse rounded bg-yt-hover" />}
        <h2 className="pro-section-title">{title}</h2>
      </div>
      <div
        className={cn(
          layout === 'row'
            ? 'grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        )}
      >
        {Array.from({ length: layout === 'row' ? 4 : 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video rounded-xl bg-yt-hover" />
            <div className="mt-3 flex gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-yt-hover" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-full rounded bg-yt-hover" />
                <div className="h-3 w-2/3 rounded bg-yt-hover" />
                <div className="h-3 w-1/2 rounded bg-yt-surface-raised" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
