'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/page-layout';
import { VideoPlayer } from '@/components/video/video-player';
import { VideoMetadataPanel } from '@/components/video/video-metadata-panel';
import { AdminVideoEditButton } from '@/components/admin/admin-video-edit-button';
import { useVideo } from '@/hooks/use-videos';
import { formatViews, formatDuration, cn } from '@/lib/utils';
import { Eye, Calendar, Film } from 'lucide-react';
import type { Video } from '@/lib/api/types';

export default function WatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const queryClient = useQueryClient();
  const { data: video, isLoading, error, refetch } = useVideo(slug);
  const [editedVideo, setEditedVideo] = useState<Video | null>(null);
  const displayVideo = editedVideo ?? video;

  const handleVideoUpdated = (updated: Video) => {
    setEditedVideo(updated);
    void refetch();
    queryClient.invalidateQueries({ queryKey: ['videos'] });
    if (updated.slug !== slug) {
      window.history.replaceState(null, '', `/watch/${updated.slug}`);
      queryClient.invalidateQueries({ queryKey: ['video', updated.slug] });
    }
  };

  const hasPlayback =
    Boolean(displayVideo?.cdnUrl) ||
    Boolean(displayVideo?.qualities && displayVideo.qualities.length > 0);

  if (isLoading && !hasPlayback) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="aspect-video rounded-xl bg-zinc-800" />
          <div className="h-8 w-2/3 rounded bg-zinc-800" />
          <div className="h-4 w-1/3 rounded bg-zinc-800" />
        </div>
      </PageLayout>
    );
  }

  if (error || !displayVideo) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Film className="mb-4 h-12 w-12 text-zinc-600" />
          <p className="text-lg font-medium text-white">Video not found</p>
          <Link href="/" className="mt-4 text-sm text-red-400 hover:underline">
            Back to home
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="!px-0 md:!px-6">
      <div className="mx-auto max-w-5xl space-y-3 md:space-y-6">
        <div className="relative ml-[calc(50%-50vw)] w-screen max-w-none md:ml-0 md:w-full md:overflow-hidden md:rounded-xl md:shadow-2xl md:shadow-black/50">
          <VideoPlayer video={displayVideo} />
        </div>

        <div className="space-y-3 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:space-y-4 md:px-0">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-[15px] font-semibold leading-snug text-white sm:text-xl lg:text-2xl">
                {displayVideo.title}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-500 sm:mt-2 sm:text-sm">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {formatViews(displayVideo.views)} views
                </span>
                {displayVideo.publishedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {new Date(displayVideo.publishedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {displayVideo.duration != null && displayVideo.duration > 0 && (
                  <span className="hidden rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline">
                    {formatDuration(displayVideo.duration)}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <AdminVideoEditButton video={displayVideo} onUpdated={handleVideoUpdated} />
            </div>
          </div>

          <VideoMetadataPanel video={displayVideo} />

          {displayVideo.videoTags && displayVideo.videoTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayVideo.videoTags.map((vt) => (
                <Link
                  key={vt.tag.id}
                  href={`/search?q=${encodeURIComponent(vt.tag.name)}`}
                  className={cn(
                    'rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1.5',
                    'text-xs text-zinc-300 transition-colors hover:border-red-500/50 hover:text-white',
                  )}
                >
                  #{vt.tag.name}
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </PageLayout>
  );
}
