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
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos, creators, topics..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-red-500/60 focus:outline-none sm:max-w-xl"
          />
        </div>
      </form>

      {searchTerm && !isLoading && (
        <p className="mb-4 text-xs text-zinc-500 sm:text-sm">
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
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 py-14 text-center">
          <Search className="mx-auto h-8 w-8 text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500">Search for videos, creators, or topics</p>
        </div>
      )}
    </PageLayout>
  );
}
