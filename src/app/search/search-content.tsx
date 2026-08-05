'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { PageHeader } from '@/components/layout/page-header';
import { VideoGrid, VideoGridSkeleton } from '@/components/video/video-grid';
import { useSearchVideos } from '@/hooks/use-videos';

export function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  const { data, isLoading } = useSearchVideos({ search: searchTerm, limit: 24 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query.trim());
  };

  const results = data?.data ?? [];
  const total = data?.meta?.total;

  return (
    <PageLayout>
      <PageHeader
        icon={Search}
        title="Search"
        subtitle="Find videos across the platform"
        accent="violet"
      />

      <form onSubmit={handleSearch} className="mb-5 sm:mb-6">
        <div className="relative sm:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yt-text-tertiary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos, creators, topics…"
            className="pro-input pl-9"
          />
        </div>
      </form>

      {searchTerm && !isLoading && (
        <p className="mb-4 text-xs text-yt-text-tertiary sm:text-sm">
          {total === 0
            ? `No results for “${searchTerm}”`
            : `${total ?? results.length} result${(total ?? results.length) === 1 ? '' : 's'} for “${searchTerm}”`}
        </p>
      )}

      {isLoading ? (
        <VideoGridSkeleton title="Results" icon={Search} />
      ) : searchTerm ? (
        <VideoGrid videos={results} icon={Search} adminEditable />
      ) : (
        <div className="pro-empty">
          <Search className="mx-auto h-8 w-8 text-yt-text-tertiary" />
          <p className="mt-3 text-sm text-yt-text-secondary">
            Search for videos, creators, or topics
          </p>
        </div>
      )}
    </PageLayout>
  );
}
