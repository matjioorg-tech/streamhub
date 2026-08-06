'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { CategoryCard, CategoryCardSkeleton } from '@/components/browse/category-card';
import { VideoGrid, VideoGridSkeleton } from '@/components/video/video-grid';
import { useCategories } from '@/hooks/use-categories';
import { useSearchVideos } from '@/hooks/use-videos';

export default function CategoriesPage() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filteredCategories = useMemo(() => {
    const list = categories ?? [];
    const term = debouncedQuery.toLowerCase();
    if (!term) return list;
    return list.filter(
      (cat) =>
        cat.name.toLowerCase().includes(term) ||
        (cat.description?.toLowerCase().includes(term) ?? false),
    );
  }, [categories, debouncedQuery]);

  const { data: videoResults, isLoading: videosLoading } = useSearchVideos({
    search: debouncedQuery,
    limit: 24,
  });

  const videoList = videoResults?.data ?? [];
  const videoTotal = videoResults?.meta?.total ?? 0;
  const isSearching = debouncedQuery.length > 0;

  return (
    <PageLayout>
      <header className="mb-8 sm:mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Your library
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-yt-text-secondary sm:text-base">
          Browse by category. Every video belongs to one of the sections below.
        </p>
      </header>

      <div className="relative mb-8 sm:max-w-lg">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-yt-text-tertiary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories or video titles…"
          className="pro-input h-11 pl-10"
        />
      </div>

      {isSearching && (
        <section className="mb-10 sm:mb-12">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Matching videos</h2>
            {!videosLoading && (
              <span className="text-sm text-yt-text-tertiary">
                {videoTotal === 0
                  ? `No videos for “${debouncedQuery}”`
                  : `${videoTotal} result${videoTotal === 1 ? '' : 's'}`}
              </span>
            )}
          </div>

          {videosLoading ? (
            <VideoGridSkeleton title="Videos" layout="grid" />
          ) : videoList.length > 0 ? (
            <VideoGrid videos={videoList} layout="grid" />
          ) : (
            <div className="pro-empty">
              <p className="text-sm text-yt-text-secondary">
                No videos match “{debouncedQuery}”. Try another title or pick a category below.
              </p>
            </div>
          )}

          {videoTotal > videoList.length && (
            <div className="mt-6 text-center">
              <Link
                href={`/search?q=${encodeURIComponent(debouncedQuery)}`}
                className="text-sm font-medium text-white transition hover:text-yt-text-secondary"
              >
                See all {videoTotal} video results →
              </Link>
            </div>
          )}
        </section>
      )}

      <section>
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">
            {isSearching ? 'Matching categories' : 'Categories'}
          </h2>
          {!categoriesLoading && (
            <span className="text-sm text-yt-text-tertiary">{filteredCategories.length}</span>
          )}
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="pro-empty">
            <p className="text-sm text-yt-text-secondary">
              {isSearching
                ? 'No categories match your search.'
                : 'No categories available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCategories.map((cat) => {
              const categoryHref = isSearching
                ? `/categories/${cat.slug}?q=${encodeURIComponent(debouncedQuery)}`
                : `/categories/${cat.slug}`;
              return <CategoryCard key={cat.id} category={cat} href={categoryHref} />;
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
