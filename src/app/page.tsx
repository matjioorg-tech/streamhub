'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/page-layout';
import { VideoGrid, VideoGridSkeleton } from '@/components/video/video-grid';
import { FeaturedVideoCard } from '@/components/video/featured-video-card';
import { useTrendingVideos, useLatestVideos } from '@/hooks/use-videos';
import { Flame, Clock, Sparkles } from 'lucide-react';
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
      <div className="space-y-8 md:space-y-10">
        <section className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-600/20 via-zinc-900 to-zinc-950 p-5 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-red-600/10 blur-3xl" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
              <Sparkles className="h-3.5 w-3.5" />
              Video streaming platform
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome to StreamHub
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Discover trending videos and the latest uploads. Watch in order by upload time and
              explore what came before and after each video.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
              <Link
                href="/trending"
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 sm:px-5"
              >
                <Flame className="h-4 w-4" />
                Explore trending
              </Link>
              <Link
                href="/latest"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 sm:px-5"
              >
                <Clock className="h-4 w-4" />
                Latest uploads
              </Link>
            </div>
          </div>
        </section>

        {latestLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="aspect-[16/10] rounded-2xl bg-zinc-800 sm:aspect-[21/9]" />
          </div>
        ) : featured ? (
          <section className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-400/90">
                Featured
              </p>
              <h2 className="mt-0.5 text-lg font-semibold text-white sm:text-xl">Just uploaded</h2>
            </div>
            <FeaturedVideoCard video={featured} />
          </section>
        ) : null}

        {trendingLoading ? (
          <VideoGridSkeleton title="Trending" layout="row" />
        ) : (
          <VideoGrid
            videos={trending ?? []}
            title="Trending"
            subtitle="Most watched right now"
            href="/trending"
            layout="row"
            adminEditable
            onVideoUpdated={handleVideoUpdated}
          />
        )}

        {latestLoading ? (
          <VideoGridSkeleton title="Latest" layout="row" />
        ) : (
          <VideoGrid
            videos={(latest ?? []).slice(featured ? 1 : 0)}
            title="Latest"
            subtitle="Newest uploads on the platform"
            href="/latest"
            layout="row"
            adminEditable
            onVideoUpdated={handleVideoUpdated}
          />
        )}
      </div>
    </PageLayout>
  );
}
