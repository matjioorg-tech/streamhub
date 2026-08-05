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
        'sticky top-[3.5rem] z-20 -mx-4 mb-5 border-b border-yt-border/80 bg-yt-bg/90 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-xl sm:border sm:bg-yt-surface/50 sm:px-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {creatorSlot ? <div className="min-w-[140px] flex-1 lg:hidden">{creatorSlot}</div> : null}

        <label className="relative min-w-[140px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yt-text-tertiary" />
          <input
            type="search"
            value={videoSearch}
            onChange={(e) => onVideoSearchChange(e.target.value)}
            placeholder="Search by video title…"
            className="pro-input pl-9"
          />
        </label>

        <select
          value={sort.value}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort videos"
          className="pro-input w-auto min-w-[9rem] shrink-0 cursor-pointer pr-8"
        >
          {VIDEO_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {typeof total === 'number' && !isLoading && (
        <p className="mt-2 text-xs text-yt-text-tertiary">
          {total === 0 ? 'No videos' : `${total.toLocaleString()} video${total === 1 ? '' : 's'}`}
        </p>
      )}
    </div>
  );
}
