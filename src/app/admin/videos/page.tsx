'use client';

import { useState, useTransition } from 'react';
import { useAdminVideos } from '@/hooks/use-admin';
import { adminApi } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
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
                  <td className="p-3 font-medium">{video.title}</td>
                  <td className="p-3">
                    <span className="rounded bg-zinc-800 px-2 py-1 text-xs">{video.status}</span>
                  </td>
                  <td className="p-3">{video.views}</td>
                  <td className="space-x-2 p-3">
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
      )}

      {deleteDialog}
    </>
  );
}
