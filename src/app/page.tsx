'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/page-layout';
import { QuickNavChip, QuickNavRow } from '@/components/layout/page-header';
import { VideoGrid, VideoGridSkeleton } from '@/components/video/video-grid';
import { FeaturedVideoCard } from '@/components/video/featured-video-card';
import { useTrendingVideos, useLatestVideos } from '@/hooks/use-videos';
import { Clock, Flame, Grid3X3, Sparkles } from 'lucide-react';
import type { Video } from '@/lib/api/types';

export default function HomePage() {
  const queryClient = useQueryClient();
  const { data: trending, isLoading: trendingLoading } = useTrendingVideos(12);
  const { data: latest, isLoading: latestLoading } = useLatestVideos(12);

  const handleVideoUpdated = (video: Video) => {
    queryClient.invalidateQueries({ queryKey: ['videos'] });
    if (video.slug) {
      queryClient.invalidateQueries({ queryKey: ['video', video.slug] });
    }
  };

  const featured = latest?.[0];

  return (
    <PageLayout>
      <div className="space-y-6 sm:space-y-8">
        <QuickNavRow>
          <QuickNavChip href="/trending" label="Trending" icon={Flame} />
          <QuickNavChip href="/latest" label="Latest" icon={Clock} />
          <QuickNavChip href="/categories" label="Browse" icon={Grid3X3} />
        </QuickNavRow>

        {latestLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-24 rounded bg-zinc-800" />
            <div className="aspect-video rounded-2xl bg-zinc-800" />
          </div>
        ) : featured ? (
          <section className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold text-white sm:text-base">Just uploaded</h2>
            </div>
            <FeaturedVideoCard video={featured} />
          </section>
        ) : null}

        {trendingLoading ? (
          <VideoGridSkeleton title="Trending" layout="row" icon={Flame} />
        ) : (
          <VideoGrid
            videos={trending ?? []}
            title="Trending"
            subtitle="Most watched right now"
            href="/trending"
            icon={Flame}
            layout="row"
            adminEditable
            onVideoUpdated={handleVideoUpdated}
          />
        )}

        {latestLoading ? (
          <VideoGridSkeleton title="Latest" layout="row" icon={Clock} />
        ) : (
          <VideoGrid
            videos={(latest ?? []).slice(featured ? 1 : 0)}
            title="Latest"
            subtitle="Fresh uploads"
            href="/latest"
            icon={Clock}
            layout="row"
            adminEditable
            onVideoUpdated={handleVideoUpdated}
          />
        )}

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-4 sm:p-5">
          <p className="text-sm font-medium text-white">Explore by category</p>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            Find creators and videos across every topic
          </p>
          <Link
            href="/categories"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-200 ring-1 ring-zinc-800 transition hover:bg-zinc-800 hover:text-white sm:text-sm"
          >
            <Grid3X3 className="h-4 w-4 text-red-400" />
            Browse categories
          </Link>
        </section>
      </div>
    </PageLayout>
  );
}
