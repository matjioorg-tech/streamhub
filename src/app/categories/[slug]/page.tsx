'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { VideoGrid } from '@/components/video/video-grid';
import { useCategory, useSubcategories } from '@/hooks/use-categories';
import { useVideos } from '@/hooks/use-videos';
import { cn } from '@/lib/utils';

export default function CategoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const selectedSub = searchParams.get('sub') ?? undefined;

  const { data: category, isLoading: categoryLoading } = useCategory(params.slug);
  const { data: subcategories, isLoading: subcategoriesLoading } = useSubcategories(params.slug);
  const { data: videos, isLoading: videosLoading } = useVideos(
    {
      category: category?.id,
      subCategory: selectedSub,
      limit: 24,
    },
    { enabled: !!category?.id },
  );

  const isLoading = categoryLoading || subcategoriesLoading || videosLoading;

  return (
    <PageLayout>
      <div className="mb-6">
        <Link href="/categories" className="text-sm text-zinc-400 hover:text-white">
          ← All categories
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {categoryLoading ? 'Loading...' : category?.name ?? 'Category'}
        </h1>
        {selectedSub && (
          <p className="mt-1 text-zinc-400">
            Showing videos by <span className="text-white">{selectedSub}</span>
          </p>
        )}
      </div>

      {(subcategories?.length ?? 0) > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={`/categories/${params.slug}`}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm transition',
              !selectedSub
                ? 'border-red-500 bg-red-500/10 text-red-400'
                : 'border-zinc-700 text-zinc-300 hover:border-zinc-500',
            )}
          >
            All
          </Link>
          {subcategories?.map((sub) => (
            <Link
              key={sub.slug}
              href={`/categories/${params.slug}?sub=${encodeURIComponent(sub.name)}`}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm transition',
                selectedSub === sub.name
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-zinc-700 text-zinc-300 hover:border-zinc-500',
              )}
            >
              {sub.name}
              <span className="ml-1.5 text-zinc-500">({sub.videoCount})</span>
            </Link>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-zinc-400">Loading videos...</div>
      ) : (
        <VideoGrid
          videos={videos?.data ?? []}
          title={selectedSub ? undefined : `All ${category?.name ?? ''} videos`}
        />
      )}
    </PageLayout>
  );
}
