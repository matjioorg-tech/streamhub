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
        'mb-6 rounded-xl border border-yt-border/70 bg-yt-surface/40 px-4 py-4 sm:static sm:mb-0 sm:bg-yt-surface/30',
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {creatorSlot ? <div className="min-w-0 sm:max-w-xs">{creatorSlot}</div> : null}

        <label className="relative min-w-0 flex-1 sm:max-w-sm">
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
        <p className="mt-3 text-sm text-yt-text-tertiary">
          {total === 0 ? 'No videos' : `${total.toLocaleString()} video${total === 1 ? '' : 's'}`}
        </p>
      )}
    </div>
  );
}
