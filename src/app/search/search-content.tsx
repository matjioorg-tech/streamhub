'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { VideoGrid } from '@/components/video/video-grid';
import { useSearchVideos } from '@/hooks/use-videos';

export function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  const { data, isLoading } = useSearchVideos({ search: searchTerm, limit: 24 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
  };

  return (
    <PageLayout>
      <h1 className="mb-6 text-2xl font-bold">Search</h1>
      <form onSubmit={handleSearch} className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos..."
          className="w-full max-w-xl rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-white focus:border-red-500 focus:outline-none"
        />
      </form>
      {isLoading ? (
        <div className="text-zinc-400">Searching...</div>
      ) : (
        <VideoGrid videos={data?.data ?? []} />
      )}
    </PageLayout>
  );
}
