'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/page-layout';
import { VideoGrid } from '@/components/video/video-grid';
import { useTrendingVideos, useLatestVideos } from '@/hooks/use-videos';
import { Flame, Sparkles } from 'lucide-react';
import type { Video } from '@/lib/api/types';

export default function HomePage() {
  const queryClient = useQueryClient();
  const { data: trending, isLoading: trendingLoading } = useTrendingVideos(8);
  const { data: latest, isLoading: latestLoading } = useLatestVideos(8);

  const handleVideoUpdated = (video: Video) => {
    queryClient.invalidateQueries({ queryKey: ['videos'] });
    if (video.slug) {
      queryClient.invalidateQueries({ queryKey: ['video', video.slug] });
    }
  };

  return (
    <PageLayout>
      <div className="space-y-10 md:space-y-12">
        <section className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-600/25 via-zinc-900 to-zinc-950 p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />
          <div className="relative">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
              <Sparkles className="h-3.5 w-3.5" />
              Video streaming platform
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome to StreamHub
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Discover trending videos and latest uploads from our community.
              Upload via Telegram, watch anywhere.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/trending"
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                <Flame className="h-4 w-4" />
                Explore trending
              </Link>
              <Link
                href="/latest"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/50 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
              >
                Latest uploads
              </Link>
            </div>
          </div>
        </section>

        {trendingLoading ? (
          <VideoGridSkeleton title="Trending" />
        ) : (
          <VideoGrid
            videos={trending ?? []}
            title="Trending"
            adminEditable
            onVideoUpdated={handleVideoUpdated}
          />
        )}

        {latestLoading ? (
          <VideoGridSkeleton title="Latest" />
        ) : (
          <VideoGrid
            videos={latest ?? []}
            title="Latest"
            adminEditable
            onVideoUpdated={handleVideoUpdated}
          />
        )}
      </div>
    </PageLayout>
  );
}

function VideoGridSkeleton({ title }: { title: string }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl">{title}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="aspect-video rounded-xl bg-zinc-800" />
            <div className="h-4 w-3/4 rounded bg-zinc-800" />
            <div className="h-3 w-1/2 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </section>
  );
}
