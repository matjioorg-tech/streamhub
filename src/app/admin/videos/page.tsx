'use client';

import { useAdminVideos } from '@/hooks/use-admin';
import { adminApi } from '@/lib/api';
import { useMemo, useState } from 'react';

export default function AdminVideosPage() {
  const { data: videos, isLoading, refetch } = useAdminVideos();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoList = videos ?? [];
  const allSelected =
    videoList.length > 0 && videoList.every((video) => selectedIds.has(video.id));
  const someSelected = selectedIds.size > 0;

  const selectedTitles = useMemo(
    () => videoList.filter((v) => selectedIds.has(v.id)).map((v) => v.title),
    [videoList, selectedIds],
  );

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(videoList.map((video) => video.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePublish = async (id: string) => {
    await adminApi.publish(id);
    refetch();
  };

  const handleUnpublish = async (id: string) => {
    await adminApi.unpublish(id);
    refetch();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setError(null);
    setDeletingId(id);
    try {
      await adminApi.deleteVideo(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refetch();
    } catch {
      setError('Failed to delete video. Make sure you are logged in as admin.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const preview =
      count <= 3
        ? selectedTitles.map((t) => `• ${t}`).join('\n')
        : `• ${selectedTitles.slice(0, 3).join('\n• ')}\n• …and ${count - 3} more`;

    if (
      !confirm(
        `Delete ${count} video${count === 1 ? '' : 's'}? This cannot be undone.\n\n${preview}`,
      )
    ) {
      return;
    }

    setError(null);
    setBulkDeleting(true);
    try {
      await adminApi.bulkDeleteVideos([...selectedIds]);
      setSelectedIds(new Set());
      refetch();
    } catch {
      setError('Failed to delete selected videos.');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Manage Videos</h1>
        {someSelected && (
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {bulkDeleting
              ? 'Deleting...'
              : `Delete selected (${selectedIds.size})`}
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
                        onClick={() => handlePublish(video.id)}
                        className="text-green-400 hover:underline"
                      >
                        Publish
                      </button>
                    )}
                    {video.status === 'published' && (
                      <button
                        type="button"
                        onClick={() => handleUnpublish(video.id)}
                        className="text-yellow-400 hover:underline"
                      >
                        Unpublish
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(video.id, video.title)}
                      disabled={deletingId === video.id || bulkDeleting}
                      className="text-red-400 hover:underline disabled:opacity-50"
                    >
                      {deletingId === video.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
