'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { CreatorBrowsePanel } from '@/components/browse/creator-browse-panel';
import { VideoBrowseToolbar } from '@/components/browse/video-browse-toolbar';
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
      { scrollToVideos: !!creatorName },
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

  const videosTitle = selectedSub
    ? `${selectedSub} — ${category?.name ?? ''}`
    : `All ${category?.name ?? ''} videos`;

  return (
    <PageLayout>
      <div className="mb-5 sm:mb-6">
        <Link href="/categories" className="text-xs text-zinc-500 transition hover:text-zinc-300">
          ← Browse
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
          {categoryLoading ? 'Loading...' : category?.name ?? 'Category'}
        </h1>
        {category?.description && (
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">{category.description}</p>
        )}
        {selectedSub ? (
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300 ring-1 ring-red-500/20 sm:text-sm">
            <span className="text-zinc-400">{creatorLabel}:</span>
            <span className="font-medium text-white">{selectedSub}</span>
            <Link
              href={buildCreatorHref()}
              className="ml-1 text-red-400 hover:text-red-300"
            >
              Clear
            </Link>
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-zinc-500 sm:text-sm">
            Pick a {creatorLabel.toLowerCase()} or browse all videos
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {hasCreators && (
          <CreatorBrowsePanel
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
          <VideoBrowseToolbar
            sort={sort}
            onSortChange={handleSortChange}
            videoSearch={videoSearch}
            onVideoSearchChange={setVideoSearch}
            total={meta?.total}
            isLoading={videosLoading || videosFetching}
          />

          {videosLoading ? (
            <VideoGridSkeleton title={videosTitle} />
          ) : (
            <>
              <VideoGrid videos={videoList} title={videosTitle} />
              {meta && meta.totalPages > 1 && (
                <Pagination meta={meta} onPageChange={handlePageChange} className="mt-8" />
              )}
            </>
          )}
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
          <div className="text-zinc-400">Loading category...</div>
        </PageLayout>
      }
    >
      <CategoryDetailContent />
    </Suspense>
  );
}
