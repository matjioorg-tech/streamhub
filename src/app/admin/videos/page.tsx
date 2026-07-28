'use client';

import { useState, useTransition } from 'react';
import { useAdminVideos } from '@/hooks/use-admin';
import { adminApi } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AdminVideoEditButton } from '@/components/admin/admin-video-edit-button';
import { cn } from '@/lib/utils';

type DeleteRequest =
  | { type: 'one'; id: string; title: string }
  | { type: 'many'; ids: string[]; titles: string[] }
  | null;

function buildListPreview(items: string[]): string {
  if (items.length <= 3) return items.map((t) => `• ${t}`).join('\n');
  return `• ${items.slice(0, 3).join('\n• ')}\n• …and ${items.length - 3} more`;
}

export default function AdminVideosPage() {
  const { data: videos, isLoading, refetch } = useAdminVideos();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startSelectionTransition] = useTransition();

  const videoList = videos ?? [];
  const selectedCount = selectedIds.size;
  const allSelected =
    videoList.length > 0 && videoList.every((video) => selectedIds.has(video.id));

  const setSelection = (updater: (prev: Set<string>) => Set<string>) => {
    startSelectionTransition(() => setSelectedIds(updater));
  };

  const toggleAll = () => {
    setSelection(() =>
      allSelected ? new Set() : new Set(videoList.map((video) => video.id)),
    );
  };

  const toggleOne = (id: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runDelete = async () => {
    if (!deleteRequest) return;

    setDeleting(true);
    setError(null);
    try {
      if (deleteRequest.type === 'one') {
        await adminApi.deleteVideo(deleteRequest.id);
        setSelection((prev) => {
          const next = new Set(prev);
          next.delete(deleteRequest.id);
          return next;
        });
      } else {
        await adminApi.bulkDeleteVideos(deleteRequest.ids);
        setSelectedIds(new Set());
      }
      setDeleteRequest(null);
      refetch();
    } catch {
      setError('Failed to delete video(s). Make sure you are logged in as admin.');
    } finally {
      setDeleting(false);
    }
  };

  const deleteDialog =
    deleteRequest?.type === 'one' ? (
      <ConfirmDialog
        title="Delete video?"
        description={`Delete "${deleteRequest.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setDeleteRequest(null)}
        onConfirm={() => void runDelete()}
      />
    ) : deleteRequest?.type === 'many' ? (
      <ConfirmDialog
        title={`Delete ${deleteRequest.ids.length} video${deleteRequest.ids.length === 1 ? '' : 's'}?`}
        description={`This cannot be undone.\n\n${buildListPreview(deleteRequest.titles)}`}
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setDeleteRequest(null)}
        onConfirm={() => void runDelete()}
      />
    ) : null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Manage Videos</h1>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={() => {
              const ids = [...selectedIds];
              const titles = videoList
                .filter((v) => selectedIds.has(v.id))
                .map((v) => v.title);
              setDeleteRequest({ type: 'many', ids, titles });
            }}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            Delete selected ({selectedCount})
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {isLoading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="space-y-3 md:hidden">
            {videoList.map((video) => (
              <div
                key={video.id}
                className={cn(
                  'rounded-xl border border-zinc-800 bg-zinc-900/50 p-4',
                  selectedIds.has(video.id) && 'ring-1 ring-red-500/50',
                )}
              >
                <div className="flex items-start gap-3">
                  <label className="flex shrink-0 cursor-pointer items-center p-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(video.id)}
                      onChange={() => toggleOne(video.id)}
                      aria-label={`Select ${video.title}`}
                      className="h-5 w-5 rounded border-zinc-600 bg-zinc-950 accent-red-600"
                    />
                  </label>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug text-white">{video.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">
                        {video.status}
                      </span>
                      <span className="text-zinc-400">{video.views} views</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <AdminVideoEditButton
                        video={video}
                        onUpdated={() => refetch()}
                      />
                      {video.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => void adminApi.publish(video.id).then(() => refetch())}
                          className="rounded-lg border border-green-800/50 bg-green-950/30 px-3 py-2 text-sm text-green-400"
                        >
                          Publish
                        </button>
                      )}
                      {video.status === 'published' && (
                        <button
                          type="button"
                          onClick={() => void adminApi.unpublish(video.id).then(() => refetch())}
                          className="rounded-lg border border-yellow-800/50 bg-yellow-950/30 px-3 py-2 text-sm text-yellow-400"
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteRequest({ type: 'one', id: video.id, title: video.title })
                        }
                        disabled={deleting}
                        className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-zinc-800 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="w-10 p-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all videos"
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-950 accent-red-600"
                    />
                  </th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Views</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videoList.map((video) => (
                  <tr
                    key={video.id}
                    className={`border-b border-zinc-800 ${
                      selectedIds.has(video.id) ? 'bg-zinc-900/60' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(video.id)}
                        onChange={() => toggleOne(video.id)}
                        aria-label={`Select ${video.title}`}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-950 accent-red-600"
                      />
                    </td>
                    <td className="max-w-[280px] truncate p-3 font-medium">{video.title}</td>
                    <td className="p-3">
                      <span className="rounded bg-zinc-800 px-2 py-1 text-xs">{video.status}</span>
                    </td>
                    <td className="p-3">{video.views}</td>
                    <td className="space-x-2 p-3">
                      <AdminVideoEditButton
                        video={video}
                        onUpdated={() => refetch()}
                      />
                      {video.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => void adminApi.publish(video.id).then(() => refetch())}
                          className="text-green-400 hover:underline"
                        >
                          Publish
                        </button>
                      )}
                      {video.status === 'published' && (
                        <button
                          type="button"
                          onClick={() => void adminApi.unpublish(video.id).then(() => refetch())}
                          className="text-yellow-400 hover:underline"
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteRequest({ type: 'one', id: video.id, title: video.title })
                        }
                        disabled={deleting}
                        className="text-red-400 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {deleteDialog}
    </>
  );
}
