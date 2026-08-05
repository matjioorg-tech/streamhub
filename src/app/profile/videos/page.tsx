'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Film, MoreVertical, RotateCcw, Search } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { PageHeader } from '@/components/layout/page-header';
import { VideoOwnerActions } from '@/components/video/video-owner-actions';
import { useMyVideos } from '@/hooks/use-videos';
import { useRetryMyVideoUpload } from '@/hooks/use-my-videos';
import type { Video } from '@/lib/api/types';
import {
  cn,
  formatDuration,
  formatRelativeTime,
  formatViews,
  getChannelLabel,
} from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'ready', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
] as const;

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function StudioVideoRow({
  video,
  onUpdated,
}: {
  video: Video;
  onUpdated: () => void;
}) {
  const retryUpload = useRetryMyVideoUpload();
  const canWatch = video.status === 'published' || video.status === 'ready';
  const canRetry =
    video.status === 'failed' || video.latestUploadTask?.status === 'failed';
  const uploadError = video.latestUploadTask?.error;
  const isRetrying = retryUpload.isPending && retryUpload.variables === video.id;

  const handleRetry = async () => {
    try {
      await retryUpload.mutateAsync(video.id);
      onUpdated();
    } catch {
      // noop
    }
  };

  return (
    <tr className="group border-b border-yt-border hover:bg-yt-hover/50">
      <td className="py-3 pr-3">
        <Link
          href={canWatch ? `/watch/${video.slug}` : '#'}
          className={cn(
            'relative block aspect-video w-36 overflow-hidden rounded-lg bg-yt-hover lg:w-40',
            !canWatch && 'pointer-events-none opacity-60',
          )}
        >
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              unoptimized
              className="object-cover"
              sizes="160px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Film className="h-6 w-6 text-yt-text-secondary" />
            </div>
          )}
          {video.duration != null && video.duration > 0 && (
            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
              {formatDuration(video.duration)}
            </span>
          )}
        </Link>
      </td>
      <td className="min-w-0 py-3 pr-4">
        {canWatch ? (
          <Link
            href={`/watch/${video.slug}`}
            className="line-clamp-2 text-sm font-medium text-white hover:underline"
          >
            {video.title}
          </Link>
        ) : (
          <p className="line-clamp-2 text-sm font-medium text-white">{video.title}</p>
        )}
        <p className="mt-1 text-xs text-yt-text-secondary">{getChannelLabel(video)}</p>
        {uploadError && (
          <p className="mt-2 line-clamp-2 text-xs text-red-400">{uploadError}</p>
        )}
        {video.latestUploadTask &&
          !canRetry &&
          video.latestUploadTask.status !== 'completed' &&
          video.latestUploadTask.progress > 0 && (
            <div className="mt-2 max-w-xs">
              <div className="mb-1 flex justify-between text-[11px] text-yt-text-secondary">
                <span>Processing</span>
                <span>{video.latestUploadTask.progress}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-yt-border">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${Math.min(100, video.latestUploadTask.progress)}%` }}
                />
              </div>
            </div>
          )}
      </td>
      <td className="hidden py-3 pr-4 text-sm text-yt-text-secondary md:table-cell">
        {statusLabel(video.status)}
      </td>
      <td className="hidden py-3 pr-4 text-sm text-yt-text-secondary lg:table-cell">
        {video.visibility}
      </td>
      <td className="hidden py-3 pr-4 text-sm text-yt-text-secondary sm:table-cell">
        {formatViews(video.views)}
      </td>
      <td className="hidden py-3 pr-4 text-sm text-yt-text-secondary xl:table-cell">
        {formatRelativeTime(video.createdAt)}
      </td>
      <td className="py-3">
        <div className="flex items-center justify-end gap-1">
          {canRetry && (
            <button
              type="button"
              onClick={() => void handleRetry()}
              disabled={isRetrying}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white hover:bg-yt-hover disabled:opacity-50"
            >
              <RotateCcw className={cn('h-3.5 w-3.5', isRetrying && 'animate-spin')} />
              {isRetrying ? 'Retrying' : 'Retry'}
            </button>
          )}
          <VideoOwnerActions video={video} compact onUpdated={onUpdated} onDeleted={onUpdated} />
        </div>
      </td>
    </tr>
  );
}

function StudioVideoCard({
  video,
  onUpdated,
}: {
  video: Video;
  onUpdated: () => void;
}) {
  const retryUpload = useRetryMyVideoUpload();
  const canWatch = video.status === 'published' || video.status === 'ready';
  const canRetry =
    video.status === 'failed' || video.latestUploadTask?.status === 'failed';
  const isRetrying = retryUpload.isPending && retryUpload.variables === video.id;

  return (
    <article className="flex gap-3 border-b border-yt-border py-4">
      <Link
        href={canWatch ? `/watch/${video.slug}` : '#'}
        className={cn(
          'relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-yt-hover',
          !canWatch && 'pointer-events-none opacity-60',
        )}
      >
        {video.thumbnailUrl ? (
          <Image src={video.thumbnailUrl} alt={video.title} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Film className="h-6 w-6 text-yt-text-secondary" />
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-white">{video.title}</p>
        <p className="mt-1 text-xs text-yt-text-secondary">
          {statusLabel(video.status)} · {formatViews(video.views)} views ·{' '}
          {formatRelativeTime(video.createdAt)}
        </p>
        <div className="mt-2 flex gap-2">
          {canRetry && (
            <button
              type="button"
              onClick={() => void retryUpload.mutateAsync(video.id).then(onUpdated)}
              disabled={isRetrying}
              className="rounded-full bg-yt-hover px-3 py-1 text-xs text-white disabled:opacity-50"
            >
              {isRetrying ? 'Retrying...' : 'Retry upload'}
            </button>
          )}
          <VideoOwnerActions video={video} compact onUpdated={onUpdated} onDeleted={onUpdated} />
        </div>
      </div>
    </article>
  );
}

export default function MyVideosPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'DESC' as const,
      ...(status ? { status } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [status, debouncedSearch],
  );

  const { data, isLoading, refetch } = useMyVideos(queryParams);
  const videos = data?.data ?? [];

  return (
    <PageLayout>
      <PageHeader
        icon={Film}
        title="Channel content"
        subtitle="Manage your uploads, edit details, and retry failed videos"
        accent="red"
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yt-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter"
            className="pro-input pl-9"
          />
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value || 'all'}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={cn(
              'pro-chip',
              status === filter.value ? 'pro-chip-active' : 'pro-chip-inactive',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-yt-hover" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="pro-empty">
          <Film className="mx-auto mb-4 h-14 w-14 text-yt-text-tertiary" />
          <p className="text-lg font-medium text-white">No videos yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-yt-text-secondary">
            Upload through the Telegram bot after linking your account.
          </p>
          <Link
            href="/profile"
            className="pro-btn pro-chip-active mt-5 inline-flex"
          >
            Go to profile
          </Link>
        </div>
      ) : (
        <>
          <div className="pro-card hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-yt-border text-xs text-yt-text-secondary">
                  <th className="py-3 pr-3 font-medium">Video</th>
                  <th className="py-3 pr-4 font-medium">Details</th>
                  <th className="hidden py-3 pr-4 font-medium md:table-cell">Status</th>
                  <th className="hidden py-3 pr-4 font-medium lg:table-cell">Visibility</th>
                  <th className="hidden py-3 pr-4 font-medium sm:table-cell">Views</th>
                  <th className="hidden py-3 pr-4 font-medium xl:table-cell">Date</th>
                  <th className="py-3 font-medium">
                    <span className="sr-only">Actions</span>
                    <MoreVertical className="h-4 w-4 opacity-0" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <StudioVideoRow
                    key={video.id}
                    video={video}
                    onUpdated={() => void refetch()}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            {videos.map((video) => (
              <StudioVideoCard
                key={video.id}
                video={video}
                onUpdated={() => void refetch()}
              />
            ))}
          </div>
        </>
      )}
    </PageLayout>
  );
}
