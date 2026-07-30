'use client';

import { SlidersHorizontal } from 'lucide-react';
import { VIDEO_SORT_OPTIONS, type VideoSortOption } from '@/lib/video-sort';

interface VideoBrowseToolbarProps {
  sort: VideoSortOption;
  onSortChange: (value: string) => void;
  videoSearch: string;
  onVideoSearchChange: (value: string) => void;
  total?: number;
  isLoading?: boolean;
}

export function VideoBrowseToolbar({
  sort,
  onSortChange,
  videoSearch,
  onVideoSearchChange,
  total,
  isLoading,
}: VideoBrowseToolbarProps) {
  return (
    <div className="mb-4 space-y-3 sm:mb-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {typeof total === 'number' && !isLoading && (
            <p className="text-xs text-zinc-500 sm:text-sm">
              {total === 0 ? 'No videos' : `${total} video${total === 1 ? '' : 's'}`}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative block min-w-0 flex-1 sm:max-w-xs">
            <span className="sr-only">Search videos</span>
            <input
              type="search"
              value={videoSearch}
              onChange={(e) => onVideoSearchChange(e.target.value)}
              placeholder="Search videos in category..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-red-500/60 focus:outline-none"
            />
          </label>

          <label className="relative block shrink-0">
            <span className="sr-only">Sort videos</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <select
              value={sort.value}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-9 pr-8 text-sm text-white focus:border-red-500/60 focus:outline-none sm:min-w-[170px]"
            >
              {VIDEO_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
