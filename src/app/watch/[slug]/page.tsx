'use client';

import { use, useState, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/page-layout';
import { VideoPlayer } from '@/components/video/video-player';
import { VideoMetadataPanel } from '@/components/video/video-metadata-panel';
import { VideoSuggestions } from '@/components/video/video-suggestions';
import { AdminVideoEditButton } from '@/components/admin/admin-video-edit-button';
import { useVideo, useNearbyVideos } from '@/hooks/use-videos';
import { warmVideoStream, findVideoInCache, getVideoStreamUrl } from '@/lib/video-cache';
import { formatViews, formatDuration, formatUploadLabel, cn } from '@/lib/utils';
import { Eye, Calendar, Film, Clock } from 'lucide-react';
import type { Video } from '@/lib/api/types';

export default function WatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const queryClient = useQueryClient();
  const { data: video, isLoading, error, refetch } = useVideo(slug);
  const { data: nearby, isLoading: nearbyLoading } = useNearbyVideos(slug, 8);
  const [editedVideo, setEditedVideo] = useState<Video | null>(null);
  const displayVideo = editedVideo ?? video;

  useLayoutEffect(() => {
    const cached = findVideoInCache(queryClient, slug);
    const streamUrl = cached ? getVideoStreamUrl(cached) : null;
    if (streamUrl) {
      warmVideoStream(streamUrl);
    }
  }, [queryClient, slug]);

  useLayoutEffect(() => {
    const streamUrl = displayVideo ? getVideoStreamUrl(displayVideo) : null;
    if (streamUrl) {
      warmVideoStream(streamUrl);
    }
  }, [displayVideo?.cdnUrl, displayVideo?.qualities]);

  const handleVideoUpdated = (updated: Video) => {
    setEditedVideo(updated);
    void refetch();
    queryClient.invalidateQueries({ queryKey: ['videos'] });
    queryClient.invalidateQueries({ queryKey: ['video', slug, 'nearby'] });
    if (updated.slug !== slug) {
      window.history.replaceState(null, '', `/watch/${updated.slug}`);
      queryClient.invalidateQueries({ queryKey: ['video', updated.slug] });
    }
  };

  const refreshStream = async (): Promise<Video | null | undefined> => {
    const result = await refetch();
    return result.data ?? null;
  };

  const hasPlayback =
    Boolean(displayVideo?.cdnUrl) ||
    Boolean(displayVideo?.qualities && displayVideo.qualities.length > 0);

  if (isLoading && !hasPlayback) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4 px-3 md:px-0">
          <div className="aspect-video rounded-xl bg-zinc-800" />
          <div className="h-8 w-2/3 rounded bg-zinc-800" />
          <div className="h-4 w-1/3 rounded bg-zinc-800" />
          <div className="grid grid-cols-2 gap-3 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-xl bg-zinc-800" />
            ))}
          </div>
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
          <VideoPlayer video={displayVideo} autoPlay onRefreshStream={refreshStream} />
        </div>

        <div className="space-y-4 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:space-y-5 md:px-0">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold leading-snug text-white sm:text-xl lg:text-2xl">
                {displayVideo.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-[11px] text-zinc-400 sm:text-xs">
                  <Eye className="h-3 w-3" />
                  {formatViews(displayVideo.views)} views
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-[11px] text-zinc-400 sm:text-xs">
                  <Clock className="h-3 w-3" />
                  Uploaded {formatUploadLabel(displayVideo.createdAt)}
                </span>
                {displayVideo.publishedAt && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-[11px] text-zinc-400 sm:text-xs">
                    <Calendar className="h-3 w-3" />
                    Published{' '}
                    {new Date(displayVideo.publishedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {displayVideo.duration != null && displayVideo.duration > 0 && (
                  <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-[11px] text-zinc-400 sm:text-xs">
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

          {nearbyLoading ? (
            <div className="space-y-6 border-t border-zinc-800/80 pt-6">
              <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
              <div className="-mx-3 flex gap-3 overflow-hidden px-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-[72vw] shrink-0 space-y-2">
                    <div className="aspect-video animate-pulse rounded-xl bg-zinc-800" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
                  </div>
                ))}
              </div>
            </div>
          ) : nearby ? (
            <VideoSuggestions before={nearby.before} after={nearby.after} />
          ) : null}
        </div>
      </div>
    </PageLayout>
  );
}
