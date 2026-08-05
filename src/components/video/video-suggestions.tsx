'use client';

import type { Video } from '@/lib/api/types';
import { VideoCard } from './video-card';
import { cn } from '@/lib/utils';

interface VideoSuggestionsProps {
  before: Video[];
  after: Video[];
  className?: string;
  variant?: 'grid' | 'sidebar';
}

function SuggestionList({
  title,
  videos,
  variant,
}: {
  title: string;
  videos: Video[];
  variant: 'grid' | 'sidebar';
}) {
  if (videos.length === 0) return null;

  if (variant === 'sidebar') {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-yt-text-secondary">{title}</h3>
        <div className="space-y-3">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} layout="horizontal" compact />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-medium text-white">{title}</h2>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} compact />
        ))}
      </div>
    </section>
  );
}

export function VideoSuggestions({
  before,
  after,
  className,
  variant = 'grid',
}: VideoSuggestionsProps) {
  if (before.length === 0 && after.length === 0) return null;

  const combined = [...before, ...after];

  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-6', className)}>
        <h2 className="text-base font-medium text-white">Up next</h2>
        <div className="space-y-3">
          {combined.map((video) => (
            <VideoCard key={video.id} video={video} layout="horizontal" compact />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8 border-t border-yt-border pt-8', className)}>
      <SuggestionList title="Uploaded before" videos={before} variant={variant} />
      <SuggestionList title="Uploaded after" videos={after} variant={variant} />
    </div>
  );
}
