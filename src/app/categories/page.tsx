'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronRight, Film } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { PageHeader } from '@/components/layout/page-header';
import { VideoGrid, VideoGridSkeleton } from '@/components/video/video-grid';
import { useCategories } from '@/hooks/use-categories';
import { useSearchVideos } from '@/hooks/use-videos';
import { getSubCategoryLabel } from '@/lib/category-labels';
import { cn } from '@/lib/utils';

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
      <PageHeader
        icon={Film}
        title="Browse"
        subtitle="Explore categories or search videos by title"
        accent="emerald"
      />

      <div className="relative mb-5 sm:max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yt-text-tertiary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories or video titles…"
          className="pro-input pl-9"
        />
      </div>

      {isSearching && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="pro-section-title flex items-center gap-2">
              <Film className="h-4 w-4 text-yt-text-tertiary" />
              Videos
            </h2>
            {!videosLoading && (
              <span className="text-xs text-yt-text-tertiary">
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
                No videos match “{debouncedQuery}”. Try a different title or browse categories
                below.
              </p>
            </div>
          )}

          {videoTotal > videoList.length && (
            <div className="mt-4 text-center">
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
        <h2 className="pro-section-title mb-4">
          {isSearching ? 'Matching categories' : 'Categories'}
          {!categoriesLoading && (
            <span className="ml-2 text-sm font-normal text-yt-text-tertiary">
              ({filteredCategories.length})
            </span>
          )}
        </h2>

        {categoriesLoading ? (
          <div className="pro-card divide-y divide-yt-border overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-yt-hover" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-yt-hover" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-yt-hover" />
                </div>
              </div>
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
          <div className="pro-card divide-y divide-yt-border overflow-hidden">
            {filteredCategories.map((cat) => {
              const creatorLabel = getSubCategoryLabel(cat.name);
              const categoryHref = isSearching
                ? `/categories/${cat.slug}?q=${encodeURIComponent(debouncedQuery)}`
                : `/categories/${cat.slug}`;
              return (
                <Link
                  key={cat.id}
                  href={categoryHref}
                  className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-yt-hover/60"
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yt-hover text-[11px] font-semibold uppercase tracking-wide text-white ring-1 ring-yt-border/60',
                    )}
                  >
                    {cat.name.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white transition group-hover:text-neutral-100">
                      {cat.name}
                    </p>
                    <p className="truncate text-xs text-yt-text-tertiary">{creatorLabel}s</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-yt-text-tertiary transition group-hover:text-white" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
