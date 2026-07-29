'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { VideoGrid } from '@/components/video/video-grid';
import { useCategory, useSubcategories } from '@/hooks/use-categories';
import { useVideos } from '@/hooks/use-videos';
import { getSubCategoryLabel } from '@/lib/category-labels';
import { cn } from '@/lib/utils';

export default function CategoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const selectedSub = searchParams.get('sub') ?? undefined;

  const [creatorSearch, setCreatorSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(creatorSearch.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [creatorSearch]);

  const { data: category, isLoading: categoryLoading } = useCategory(params.slug);
  const { data: subcategories, isLoading: subcategoriesLoading } = useSubcategories(
    params.slug,
    debouncedSearch,
  );
  const { data: videos, isLoading: videosLoading } = useVideos(
    {
      category: category?.id,
      subCategory: selectedSub,
      limit: 24,
    },
    { enabled: !!category?.id },
  );

  const creatorLabel = useMemo(
    () => getSubCategoryLabel(category?.name),
    [category?.name],
  );

  const isLoading = categoryLoading || videosLoading;
  const hasCreators = (subcategories?.length ?? 0) > 0;

  return (
    <PageLayout>
      <div className="mb-5">
        <Link href="/categories" className="text-sm text-zinc-400 hover:text-white">
          ← All categories
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">
          {categoryLoading ? 'Loading...' : category?.name ?? 'Category'}
        </h1>
        {selectedSub ? (
          <p className="mt-1 text-sm text-zinc-400">
            {creatorLabel}: <span className="text-white">{selectedSub}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">Select a {creatorLabel.toLowerCase()} to filter videos</p>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {hasCreators && (
          <aside className="w-full shrink-0 lg:w-64 xl:w-72">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 lg:sticky lg:top-20">
              <div className="border-b border-zinc-800 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {creatorLabel}s
                </p>
                <input
                  type="search"
                  value={creatorSearch}
                  onChange={(e) => setCreatorSearch(e.target.value)}
                  placeholder={`Search ${creatorLabel.toLowerCase()}s...`}
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-red-500/60 focus:outline-none"
                />
              </div>

              <nav className="max-h-[min(50vh,420px)] overflow-y-auto p-2">
                <Link
                  href={`/categories/${params.slug}`}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition',
                    !selectedSub
                      ? 'bg-red-500/15 font-medium text-red-300'
                      : 'text-zinc-300 hover:bg-zinc-900',
                  )}
                >
                  <span>All videos</span>
                </Link>

                {subcategoriesLoading ? (
                  <p className="px-3 py-4 text-sm text-zinc-500">Loading...</p>
                ) : subcategories?.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-zinc-500">No matches</p>
                ) : (
                  subcategories?.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/categories/${params.slug}?sub=${encodeURIComponent(sub.name)}`}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition',
                        selectedSub?.toLowerCase() === sub.name.toLowerCase()
                          ? 'bg-red-500/15 font-medium text-red-300'
                          : 'text-zinc-300 hover:bg-zinc-900',
                      )}
                    >
                      <span className="truncate">{sub.name}</span>
                      <span className="shrink-0 text-xs text-zinc-500">{sub.videoCount}</span>
                    </Link>
                  ))
                )}
              </nav>
            </div>
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="text-zinc-400">Loading videos...</div>
          ) : (
            <VideoGrid
              videos={videos?.data ?? []}
              title={
                selectedSub
                  ? `${selectedSub} — ${category?.name ?? ''}`
                  : `All ${category?.name ?? ''} videos`
              }
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
