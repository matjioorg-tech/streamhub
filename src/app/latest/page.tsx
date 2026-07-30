'use client';

import { PageLayout } from '@/components/layout/page-layout';
import { PageHeader } from '@/components/layout/page-header';
import { VideoGrid, VideoGridSkeleton } from '@/components/video/video-grid';
import { useLatestVideos } from '@/hooks/use-videos';
import { Clock } from 'lucide-react';

export default function LatestPage() {
  const { data, isLoading } = useLatestVideos(24);

  return (
    <PageLayout>
      <PageHeader
        icon={Clock}
        title="Latest"
        subtitle="Newest uploads on the platform"
        accent="blue"
      />
      {isLoading ? (
        <VideoGridSkeleton title="Latest" icon={Clock} />
      ) : (
        <VideoGrid videos={data ?? []} icon={Clock} adminEditable />
      )}
    </PageLayout>
  );
}
