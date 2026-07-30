'use client';

import { Search } from 'lucide-react';
import { VIDEO_SORT_OPTIONS, type VideoSortOption } from '@/lib/video-sort';
import { cn } from '@/lib/utils';

interface CategoryFilterBarProps {
  sort: VideoSortOption;
  onSortChange: (value: string) => void;
  videoSearch: string;
  onVideoSearchChange: (value: string) => void;
  creatorSlot?: React.ReactNode;
  total?: number;
  isLoading?: boolean;
  className?: string;
}

export function CategoryFilterBar({
  sort,
  onSortChange,
  videoSearch,
  onVideoSearchChange,
  creatorSlot,
  total,
  isLoading,
  className,
}: CategoryFilterBarProps) {
  return (
    <div
      className={cn(
        'sticky top-[3.5rem] z-20 -mx-4 mb-4 border-b border-zinc-800/80 bg-zinc-950/95 px-4 py-2 backdrop-blur-md sm:static sm:mx-0 sm:rounded-lg sm:border sm:px-3',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {creatorSlot ? <div className="min-w-[140px] flex-1 lg:hidden">{creatorSlot}</div> : null}

        <label className="relative min-w-[120px] flex-1 sm:max-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={videoSearch}
            onChange={(e) => onVideoSearchChange(e.target.value)}
            placeholder="Search videos…"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-8 pr-2 text-xs text-white placeholder:text-zinc-500 focus:border-red-500/50 focus:outline-none sm:text-sm"
          />
        </label>

        <select
          value={sort.value}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort videos"
          className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs text-white focus:border-red-500/50 focus:outline-none sm:text-sm"
        >
          {VIDEO_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {typeof total === 'number' && !isLoading && (
        <p className="mt-1.5 text-[11px] text-zinc-500">
          {total === 0 ? 'No videos' : `${total} video${total === 1 ? '' : 's'}`}
        </p>
      )}
    </div>
  );
}
