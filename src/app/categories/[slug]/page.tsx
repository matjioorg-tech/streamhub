'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { CreatorSelect, CreatorSidebar } from '@/components/browse/creator-browse-panel';
import { CategoryFilterBar } from '@/components/browse/category-filter-bar';
import { VideoGrid, VideoGridSkeleton } from '@/components/video/video-grid';
import { Pagination } from '@/components/ui/pagination';
import { useCategory, useSubcategories } from '@/hooks/use-categories';
import { useVideos } from '@/hooks/use-videos';
import { getSubCategoryLabel } from '@/lib/category-labels';
import { parseVideoSort } from '@/lib/video-sort';

const PAGE_SIZE = 20;

function CategoryDetailContent() {
  const params = useParams<{ slug: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const videosRef = useRef<HTMLDivElement>(null);

  const selectedSub = searchParams.get('sub') ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const sort = parseVideoSort(searchParams.get('sort'));
  const videoSearchParam = searchParams.get('q') ?? '';

  const [creatorSearch, setCreatorSearch] = useState('');
  const [debouncedCreatorSearch, setDebouncedCreatorSearch] = useState('');
  const [videoSearch, setVideoSearch] = useState(videoSearchParam);
  const [debouncedVideoSearch, setDebouncedVideoSearch] = useState(videoSearchParam);

  useEffect(() => {
    setVideoSearch(videoSearchParam);
    setDebouncedVideoSearch(videoSearchParam);
  }, [videoSearchParam]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedCreatorSearch(creatorSearch.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [creatorSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedVideoSearch(videoSearch.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [videoSearch]);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>, options?: { scrollToVideos?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      if (options?.scrollToVideos) {
        window.requestAnimationFrame(() => {
          videosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    },
    [pathname, router, searchParams],
  );

  const buildCreatorHref = useCallback(
    (creatorName?: string) => {
      const next = new URLSearchParams();
      if (creatorName) next.set('sub', creatorName);
      if (sort.value !== 'newest') next.set('sort', sort.value);
      if (debouncedVideoSearch.trim()) next.set('q', debouncedVideoSearch.trim());
      const query = next.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [debouncedVideoSearch, pathname, sort.value],
  );

  useEffect(() => {
    const normalized = debouncedVideoSearch.trim();
    if (normalized === videoSearchParam) return;
    updateParams(
      {
        q: normalized || undefined,
        page: undefined,
        sub: selectedSub,
        sort: sort.value !== 'newest' ? sort.value : undefined,
      },
      { scrollToVideos: false },
    );
  }, [debouncedVideoSearch, selectedSub, sort.value, updateParams, videoSearchParam]);

  const { data: category, isLoading: categoryLoading } = useCategory(params.slug);
  const { data: subcategories, isLoading: subcategoriesLoading } = useSubcategories(
    params.slug,
    debouncedCreatorSearch,
  );

  const videoQuery = useMemo(
    () => ({
      category: category?.id,
      subCategory: selectedSub,
      search: debouncedVideoSearch || undefined,
      page,
      limit: PAGE_SIZE,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    }),
    [category?.id, debouncedVideoSearch, page, selectedSub, sort.sortBy, sort.sortOrder],
  );

  const { data: videos, isLoading: videosLoading, isFetching: videosFetching } = useVideos(
    videoQuery,
    { enabled: !!category?.id },
  );

  const creatorLabel = useMemo(() => getSubCategoryLabel(category?.name), [category?.name]);
  const hasCreators = (subcategories?.length ?? 0) > 0 || subcategoriesLoading;
  const meta = videos?.meta;
  const videoList = videos?.data ?? [];

  const handleCreatorSelect = (creatorName: string | undefined) => {
    updateParams(
      {
        sub: creatorName,
        page: undefined,
        q: debouncedVideoSearch || undefined,
        sort: sort.value !== 'newest' ? sort.value : undefined,
      },
      { scrollToVideos: false },
    );
  };

  const handleSortChange = (value: string) => {
    updateParams({
      sort: value === 'newest' ? undefined : value,
      page: undefined,
      sub: selectedSub,
      q: debouncedVideoSearch || undefined,
    });
  };

  const handlePageChange = (nextPage: number) => {
    updateParams(
      {
        page: nextPage <= 1 ? undefined : String(nextPage),
        sub: selectedSub,
        q: debouncedVideoSearch || undefined,
        sort: sort.value !== 'newest' ? sort.value : undefined,
      },
      { scrollToVideos: true },
    );
  };

  return (
    <PageLayout>
      <div className="mb-6 flex items-start gap-3 sm:mb-8">
        <Link
          href="/categories"
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
          aria-label="Back to categories"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {categoryLoading ? 'Loading…' : category?.name ?? 'Category'}
          </h1>
          {selectedSub ? (
            <p className="mt-1 text-sm text-zinc-400">
              {creatorLabel}: <span className="text-zinc-200">{selectedSub}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">
              All videos in this category
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {hasCreators && (
          <CreatorSidebar
            creatorLabel={creatorLabel}
            subcategories={subcategories ?? []}
            selectedSub={selectedSub}
            isLoading={subcategoriesLoading}
            search={creatorSearch}
            onSearchChange={setCreatorSearch}
            onSelect={handleCreatorSelect}
            buildHref={buildCreatorHref}
          />
        )}

        <div ref={videosRef} className="min-w-0 flex-1 scroll-mt-24">
          <CategoryFilterBar
            sort={sort}
            onSortChange={handleSortChange}
            videoSearch={videoSearch}
            onVideoSearchChange={setVideoSearch}
            total={meta?.total}
            isLoading={videosLoading || videosFetching}
            creatorSlot={
              hasCreators ? (
                <CreatorSelect
                  creatorLabel={creatorLabel}
                  subcategories={subcategories ?? []}
                  selectedSub={selectedSub}
                  isLoading={subcategoriesLoading}
                  onSelect={handleCreatorSelect}
                />
              ) : undefined
            }
          />

          <div className="mt-6">
            {videosLoading ? (
              <VideoGridSkeleton title="Videos" />
            ) : (
              <>
                <VideoGrid videos={videoList} />
                {meta && meta.totalPages > 1 && (
                  <Pagination meta={meta} onPageChange={handlePageChange} className="mt-8" />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function CategoryDetailPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <div className="text-sm text-zinc-500">Loading category…</div>
        </PageLayout>
      }
    >
      <CategoryDetailContent />
    </Suspense>
  );
}
