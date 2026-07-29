'use client';

import type { Video } from '@/lib/api/types';
import { VideoCard } from './video-card';
import { cn } from '@/lib/utils';

interface VideoSuggestionsProps {
  before: Video[];
  after: Video[];
  className?: string;
}

function SuggestionRow({
  title,
  subtitle,
  label,
  videos,
}: {
  title: string;
  subtitle: string;
  label: string;
  videos: Video[];
}) {
  if (videos.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-red-400/90">
            {label}
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-white sm:text-lg">{title}</h2>
          <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-1 snap-x snap-mandatory scrollbar-none sm:-mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="w-[72vw] shrink-0 snap-start sm:w-auto sm:shrink"
          >
            <VideoCard video={video} badge={label} compact />
          </div>
        ))}
      </div>
    </section>
  );
}

export function VideoSuggestions({ before, after, className }: VideoSuggestionsProps) {
  if (before.length === 0 && after.length === 0) return null;

  return (
    <div className={cn('space-y-8 border-t border-zinc-800/80 pt-6 sm:space-y-10 sm:pt-8', className)}>
      <SuggestionRow
        label="Earlier"
        title="Uploaded before this video"
        subtitle="Older uploads in your library"
        videos={before}
      />
      <SuggestionRow
        label="Later"
        title="Uploaded after this video"
        subtitle="Newer uploads in your library"
        videos={after}
      />
    </div>
  );
}
