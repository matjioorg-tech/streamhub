'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { PageHeader } from '@/components/layout/page-header';
import { VideoGrid, VideoGridSkeleton } from '@/components/video/video-grid';
import { useTrendingVideos } from '@/hooks/use-videos';
import { Flame } from 'lucide-react';

export default function TrendingPage() {
  const { data, isLoading } = useTrendingVideos(24);

  return (
    <PageLayout>
      <PageHeader
        icon={Flame}
        title="Trending"
        subtitle="The most watched videos right now"
        accent="orange"
      />
      {isLoading ? (
        <VideoGridSkeleton title="Trending" icon={Flame} />
      ) : (
        <VideoGrid videos={data ?? []} icon={Flame} adminEditable />
      )}
    </PageLayout>
  );
}
