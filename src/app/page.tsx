'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/page-layout';
import { QuickNavChip, QuickNavRow } from '@/components/layout/page-header';
import { VideoGrid, VideoGridSkeleton } from '@/components/video/video-grid';
import { useTrendingVideos, useLatestVideos } from '@/hooks/use-videos';
import { Clock, Flame, Grid3X3 } from 'lucide-react';
import type { Video } from '@/lib/api/types';

export default function HomePage() {
  const queryClient = useQueryClient();
  const { data: trending, isLoading: trendingLoading } = useTrendingVideos(16);
  const { data: latest, isLoading: latestLoading } = useLatestVideos(16);

  const handleVideoUpdated = (video: Video) => {
    queryClient.invalidateQueries({ queryKey: ['videos'] });
    if (video.slug) {
      queryClient.invalidateQueries({ queryKey: ['video', video.slug] });
    }
  };

  return (
    <PageLayout>
      <QuickNavRow className="mb-4 lg:mb-6">
        <QuickNavChip href="/" label="All" active />
        <QuickNavChip href="/trending" label="Trending" icon={Flame} />
        <QuickNavChip href="/latest" label="Latest" icon={Clock} />
        <QuickNavChip href="/categories" label="Explore" icon={Grid3X3} />
      </QuickNavRow>

      {latestLoading ? (
        <VideoGridSkeleton title="Recommended" layout="grid" />
      ) : (
        <VideoGrid
          videos={latest ?? []}
          title="Recommended"
          adminEditable
          onVideoUpdated={handleVideoUpdated}
          layout="grid"
        />
      )}

      {!trendingLoading && (trending?.length ?? 0) > 0 && (
        <div className="mt-10 border-t border-yt-border/80 pt-10">
          <VideoGrid
            videos={trending ?? []}
            title="Trending now"
            href="/trending"
            adminEditable
            onVideoUpdated={handleVideoUpdated}
            layout="grid"
          />
        </div>
      )}

      {trendingLoading && (
        <div className="mt-10 border-t border-yt-border/80 pt-10">
          <VideoGridSkeleton title="Trending now" layout="grid" icon={Flame} />
        </div>
      )}
    </PageLayout>
  );
}
