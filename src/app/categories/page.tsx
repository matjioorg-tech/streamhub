'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { CategoryRow, CategoryRowSkeleton } from '@/components/browse/category-card';
import { LibraryPrivacyNotice } from '@/components/browse/library-privacy-notice';
import { VideoGrid, VideoGridSkeleton } from '@/components/video/video-grid';
import { useCategories } from '@/hooks/use-categories';
import { useStarredCategories } from '@/hooks/use-starred-categories';
import { useSearchVideos } from '@/hooks/use-videos';

export default function CategoriesPage() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { starred, toggleStar, isStarred } = useStarredCategories();
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

  const starredCategories = useMemo(() => {
    if (!categories?.length || starred.length === 0) return [];
    const set = new Set(starred);
    return categories.filter((c) => set.has(c.slug));
  }, [categories, starred]);

  const { data: videoResults, isLoading: videosLoading } = useSearchVideos({
    search: debouncedQuery,
    limit: 24,
  });

  const videoList = videoResults?.data ?? [];
  const videoTotal = videoResults?.meta?.total ?? 0;
  const isSearching = debouncedQuery.length > 0;

  const renderCategory = (cat: (typeof filteredCategories)[number]) => {
    const categoryHref = isSearching
      ? `/categories/${cat.slug}?q=${encodeURIComponent(debouncedQuery)}`
      : `/categories/${cat.slug}`;
    return (
      <CategoryRow
        key={cat.id}
        category={cat}
        href={categoryHref}
        starred={isStarred(cat.slug)}
        onToggleStar={() => toggleStar(cat.slug)}
      />
    );
  };

  return (
    <PageLayout>
      <header className="mb-6">
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-white sm:text-3xl">
          What&apos;s the topic?
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-yt-text-secondary sm:text-[15px]">
          Tap a topic to open only its videos. Topics stay separate so each list stays focused.
        </p>
      </header>

      <LibraryPrivacyNotice className="mb-6" />

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-yt-text-tertiary" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics or video titles…"
          className="pro-input h-11 rounded-xl pl-10"
        />
      </div>

      {isSearching && (
        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-white">Matching videos</h2>
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
                No videos match “{debouncedQuery}”. Try another title or pick a topic below.
              </p>
            </div>
          )}

          {videoTotal > videoList.length && (
            <div className="mt-5 text-center">
              <Link
                href={`/search?q=${encodeURIComponent(debouncedQuery)}`}
                className="text-sm font-medium text-accent transition hover:text-accent-hover"
              >
                See all {videoTotal} results →
              </Link>
            </div>
          )}
        </section>
      )}

      {!isSearching && starredCategories.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-yt-text-tertiary">
            Starred topics
          </h2>
          <div className="space-y-3">{starredCategories.map(renderCategory)}</div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-yt-text-tertiary">
          {isSearching ? 'Matching topics' : 'All topics'}
          {!categoriesLoading && (
            <span className="ml-2 font-normal normal-case text-yt-text-tertiary">
              ({filteredCategories.length})
            </span>
          )}
        </h2>

        {categoriesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CategoryRowSkeleton key={i} />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="pro-empty">
            <p className="text-sm text-yt-text-secondary">
              {isSearching ? 'No topics match your search.' : 'No topics available yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">{filteredCategories.map(renderCategory)}</div>
        )}
      </section>
    </PageLayout>
  );
}
