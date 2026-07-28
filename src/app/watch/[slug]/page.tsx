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

  if (isLoading) {
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
        <div className="w-full md:overflow-hidden md:rounded-xl md:shadow-2xl md:shadow-black/50">
          <VideoPlayer video={displayVideo} />
        </div>

        <div className="space-y-4 px-4 pb-[env(safe-area-inset-bottom)] md:px-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold leading-snug text-white sm:text-2xl lg:text-3xl">
              {displayVideo.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {formatViews(displayVideo.views)} views
              </span>
              {displayVideo.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(displayVideo.publishedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {displayVideo.duration != null && displayVideo.duration > 0 && (
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                  {formatDuration(displayVideo.duration)}
                </span>
              )}
            </div>
            </div>
            <AdminVideoEditButton video={displayVideo} onUpdated={handleVideoUpdated} />
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

          <p className="text-center text-xs text-zinc-500 sm:text-left md:text-zinc-600">
            <span className="sm:hidden">Double-tap sides to skip · Hold & slide for speed</span>
            <span className="hidden sm:inline">
              Double-tap left/right to skip 10s · Hold & slide ← slower / faster → for speed · Gear icon for quality
            </span>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
