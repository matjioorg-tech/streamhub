'use client';

import { use, useState, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/page-layout';
import { VideoPlayer } from '@/components/video/video-player';
import { VideoMetadataPanel } from '@/components/video/video-metadata-panel';
import { VideoSuggestions } from '@/components/video/video-suggestions';
import { AdminVideoEditButton } from '@/components/admin/admin-video-edit-button';
import { VideoOwnerActions } from '@/components/video/video-owner-actions';
import { useVideo, useNearbyVideos } from '@/hooks/use-videos';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { warmVideoStream, findVideoInCache, getVideoStreamUrl } from '@/lib/video-cache';
import { markWatchPage } from '@/lib/video-player-diagnostics';
import { formatViews, formatDuration, formatRelativeTime, getChannelInitial, getChannelLabel } from '@/lib/utils';
import { Film } from 'lucide-react';
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
  const isAdmin = useIsAdmin();
  const [editedVideo, setEditedVideo] = useState<Video | null>(null);
  const displayVideo = editedVideo ?? video;

  useLayoutEffect(() => {
    markWatchPage(slug, 'watch_page_mount');
  }, [slug]);

  useLayoutEffect(() => {
    if (displayVideo) {
      markWatchPage(slug, 'video_data_ready', {
        fromCache: Boolean(video && !isLoading),
        hasCdnUrl: Boolean(displayVideo.cdnUrl),
        mimeType: displayVideo.mimeType,
      });
    }
  }, [displayVideo, isLoading, slug, video]);

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
          <div className="aspect-video rounded-xl bg-yt-hover" />
          <div className="h-8 w-2/3 rounded bg-yt-hover" />
          <div className="h-4 w-1/3 rounded bg-yt-hover" />
          <div className="grid grid-cols-2 gap-3 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-xl bg-yt-hover" />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !displayVideo) {
    return (
      <PageLayout>
        <div className="pro-empty">
          <Film className="mx-auto mb-4 h-12 w-12 text-yt-text-tertiary" />
          <p className="text-lg font-medium text-white">Video not found</p>
          <Link href="/" className="mt-4 inline-block text-sm text-accent hover:text-accent-hover">
            Back to home
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="!px-0 lg:!px-6" hideMobileNav>
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_402px] xl:items-start xl:gap-6">
        <div className="min-w-0">
          <div className="relative w-full overflow-hidden bg-black xl:rounded-xl">
            <VideoPlayer video={displayVideo} autoPlay onRefreshStream={refreshStream} />
          </div>

          <div className="space-y-4 px-4 py-4 lg:px-0">
            <div>
              <h1 className="text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl">
                {displayVideo.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-yt-border pb-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-yt-text-secondary">
                  <span>{formatViews(displayVideo.views)} views</span>
                  <span>·</span>
                  <span>{formatRelativeTime(displayVideo.createdAt)}</span>
                  {displayVideo.duration != null && displayVideo.duration > 0 && (
                    <>
                      <span>·</span>
                      <span>{formatDuration(displayVideo.duration)}</span>
                    </>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!isAdmin && (
                    <VideoOwnerActions
                      video={displayVideo}
                      onUpdated={handleVideoUpdated}
                      onDeleted={() => {
                        window.location.href = '/profile/videos';
                      }}
                    />
                  )}
                  <AdminVideoEditButton video={displayVideo} onUpdated={handleVideoUpdated} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border border-yt-border/80 bg-yt-surface p-3">
              <div className="pro-avatar h-10 w-10 shrink-0 text-sm">
                {getChannelInitial(getChannelLabel(displayVideo))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{getChannelLabel(displayVideo)}</p>
                {displayVideo.category?.name && (
                  <p className="text-xs text-yt-text-secondary">{displayVideo.category.name}</p>
                )}
              </div>
            </div>

            <VideoMetadataPanel video={displayVideo} />

            {displayVideo.videoTags && displayVideo.videoTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {displayVideo.videoTags.map((vt) => (
                  <Link
                    key={vt.tag.id}
                    href={`/search?q=${encodeURIComponent(vt.tag.name)}`}
                    className="rounded-lg bg-yt-hover px-3 py-1.5 text-xs text-yt-text-secondary transition hover:bg-yt-border hover:text-white"
                  >
                    #{vt.tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="hidden min-w-0 xl:block">
          {!nearbyLoading && nearby ? (
            <VideoSuggestions
              before={nearby.before}
              after={nearby.after}
              variant="sidebar"
              className="sticky top-[calc(3.5rem+1rem)]"
            />
          ) : nearbyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="aspect-video w-40 animate-pulse rounded-lg bg-yt-hover" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-yt-hover" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-yt-hover" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>

      <div className="px-4 pb-6 xl:hidden">
        {nearbyLoading ? (
          <div className="space-y-3 border-t border-yt-border pt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-xl bg-yt-hover" />
            ))}
          </div>
        ) : nearby ? (
          <VideoSuggestions before={nearby.before} after={nearby.after} />
        ) : null}
      </div>
    </PageLayout>
  );
}
