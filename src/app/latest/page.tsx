'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { VideoGrid } from '@/components/video/video-grid';
import { useLatestVideos } from '@/hooks/use-videos';

export default function LatestPage() {
  const { data, isLoading } = useLatestVideos(24);

  return (
    <PageLayout>
      <h1 className="mb-6 text-2xl font-bold">Latest</h1>
      {isLoading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : (
        <VideoGrid videos={data ?? []} />
      )}
    </PageLayout>
  );
}
