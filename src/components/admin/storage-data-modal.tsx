'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { adminApi } from '@/lib/api';
import type { B2StorageKey } from '@/lib/api/types';
import { formatBytes } from '@/lib/utils';
import { keysForSameVideoPrefix } from '@/lib/video-storage-key';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type DeleteRequest =
  | { type: 'one'; key: string }
  | { type: 'many'; keys: string[] }
  | { type: 'wipe' }
  | null;

interface StorageDataModalProps {
  storageKey: B2StorageKey;
  onClose: () => void;
  onUsageChanged: () => void;
}

export function StorageDataModal({
  storageKey,
  onClose,
  onUsageChanged,
}: StorageDataModalProps) {
  const [objects, setObjects] = useState<Awaited<
    ReturnType<typeof adminApi.listStorageObjects>
  >['objects']>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [prefix, setPrefix] = useState('');
  const [searchPrefix, setSearchPrefix] = useState('');
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingKey, setViewingKey] = useState<string | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<DeleteRequest>(null);
  const [deleting, setDeleting] = useState(false);
  const [, startSelectionTransition] = useTransition();

  const selectedCount = selectedKeys.size;
  const allSelected = objects.length > 0 && objects.every((o) => selectedKeys.has(o.key));

  const fetchObjects = useCallback(
    async (token?: string | null, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const result = await adminApi.listStorageObjects(storageKey.id, {
          continuationToken: token ?? undefined,
          prefix: searchPrefix || undefined,
        });
        setObjects((prev) => (append ? [...prev, ...result.objects] : result.objects));
        setNextToken(result.nextContinuationToken);
        if (!append) setSelectedKeys(new Set());
      } catch {
        setError('Failed to load storage objects.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [storageKey.id, searchPrefix],
  );

  useEffect(() => {
    fetchObjects(null, false);
  }, [fetchObjects]);

  const setSelection = (updater: (prev: Set<string>) => Set<string>) => {
    startSelectionTransition(() => {
      setSelectedKeys(updater);
    });
  };

  const toggleAll = () => {
    setSelection(() =>
      allSelected ? new Set() : new Set(objects.map((o) => o.key)),
    );
  };

  const toggleOne = (key: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const buildBulkDeleteDescription = (keys: string[]) => {
    const count = keys.length;
    const preview =
      count <= 3
        ? keys.map((k) => `• ${k}`).join('\n')
        : `• ${keys.slice(0, 3).join('\n• ')}\n• …and ${count - 3} more`;
    return `This cannot be undone.\n\n${preview}`;
  };

  const runDelete = async () => {
    if (!deleteRequest) return;

    setDeleting(true);
    setError(null);

    try {
      if (deleteRequest.type === 'one') {
        await adminApi.deleteStorageObject(storageKey.id, deleteRequest.key);
        const matches = keysForSameVideoPrefix(deleteRequest.key);
        setObjects((prev) => prev.filter((o) => !matches(o.key)));
        setSelection((prev) => {
          const next = new Set(prev);
          for (const key of [...next]) {
            if (matches(key)) next.delete(key);
          }
          return next;
        });
      } else if (deleteRequest.type === 'many') {
        const result = await adminApi.bulkDeleteStorageObjects(
          storageKey.id,
          deleteRequest.keys,
        );
        const failed = new Set(result.failed);
        setObjects((prev) => prev.filter((o) => !failed.has(o.key)));
        setSelectedKeys(failed);
        if (result.failed.length > 0) {
          setError(`Deleted ${result.deleted} object(s). Failed: ${result.failed.length}.`);
        }
      } else {
        const result = await adminApi.wipeStorageKey(storageKey.id);
        setObjects([]);
        setSelectedKeys(new Set());
        if (result.failed.length > 0) {
          setError(
            `Wiped ${result.deleted} object(s). ${result.failed.length} object(s) could not be deleted.`,
          );
        }
      }
      onUsageChanged();
      setDeleteRequest(null);
    } catch {
      setError('Failed to delete selected objects.');
    } finally {
      setDeleting(false);
    }
  };

  const handleView = async (objectKey: string) => {
    setViewingKey(objectKey);
    setError(null);
    try {
      const { url } = await adminApi.getStorageObjectUrl(storageKey.id, objectKey);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError(`Failed to open "${objectKey}".`);
    } finally {
      setViewingKey(null);
    }
  };

  const deleteDialog =
    deleteRequest?.type === 'one' ? (
      <ConfirmDialog
        title="Delete object?"
        description={`Delete "${deleteRequest.key}" from B2? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setDeleteRequest(null)}
        onConfirm={() => void runDelete()}
      />
    ) : deleteRequest?.type === 'many' ? (
      <ConfirmDialog
        title={`Delete ${deleteRequest.keys.length} object${deleteRequest.keys.length === 1 ? '' : 's'}?`}
        description={buildBulkDeleteDescription(deleteRequest.keys)}
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setDeleteRequest(null)}
        onConfirm={() => void runDelete()}
      />
    ) : deleteRequest?.type === 'wipe' ? (
      <ConfirmDialog
        title="Wipe entire bucket?"
        description="This deletes every object in this B2 bucket and removes all videos from the site. This cannot be undone."
        confirmLabel="Wipe everything"
        loading={deleting}
        onCancel={() => setDeleteRequest(null)}
        onConfirm={() => void runDelete()}
      />
    ) : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Storage data — {storageKey.name}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {storageKey.bucket} · {objects.length} object{objects.length === 1 ? '' : 's'}{' '}
                loaded
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteRequest({ type: 'wipe' })}
                disabled={deleting}
                className="rounded-lg border border-red-800 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50"
              >
                Wipe all
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setDeleteRequest({ type: 'many', keys: [...selectedKeys] })
                  }
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  Delete selected ({selectedCount})
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchPrefix(prefix.trim());
            }}
            className="flex gap-2 border-b border-zinc-800 px-6 py-3"
          >
            <input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="Filter by prefix, e.g. videos/"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
            >
              Filter
            </button>
            {searchPrefix && (
              <button
                type="button"
                onClick={() => {
                  setPrefix('');
                  setSearchPrefix('');
                }}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
              >
                Clear
              </button>
            )}
          </form>

          {error && (
            <p className="mx-6 mt-3 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex-1 overflow-auto px-6 py-4">
            {loading ? (
              <p className="text-zinc-400">Loading objects...</p>
            ) : objects.length === 0 ? (
              <p className="text-zinc-400">No objects found in this bucket.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-zinc-950 text-zinc-400">
                  <tr className="border-b border-zinc-800">
                    <th className="w-10 p-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="Select all objects"
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-950 accent-red-600"
                      />
                    </th>
                    <th className="p-2">Object key</th>
                    <th className="p-2">Size</th>
                    <th className="p-2">Modified</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {objects.map((obj) => (
                    <tr
                      key={obj.key}
                      className={`border-b border-zinc-900 ${
                        selectedKeys.has(obj.key) ? 'bg-zinc-900/60' : ''
                      }`}
                    >
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(obj.key)}
                          onChange={() => toggleOne(obj.key)}
                          aria-label={`Select ${obj.key}`}
                          className="h-4 w-4 rounded border-zinc-600 bg-zinc-950 accent-red-600"
                        />
                      </td>
                      <td
                        className="max-w-xs truncate p-2 font-mono text-xs text-zinc-300"
                        title={obj.key}
                      >
                        {obj.key}
                      </td>
                      <td className="p-2 text-zinc-400">{formatBytes(obj.size)}</td>
                      <td className="p-2 text-zinc-500">
                        {obj.lastModified
                          ? new Date(obj.lastModified).toLocaleString()
                          : '—'}
                      </td>
                      <td className="space-x-2 p-2 text-right">
                        <button
                          type="button"
                          onClick={() => void handleView(obj.key)}
                          disabled={viewingKey === obj.key || deleting}
                          className="text-blue-400 hover:underline disabled:opacity-50"
                        >
                          {viewingKey === obj.key ? 'Opening...' : 'View'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteRequest({ type: 'one', key: obj.key })}
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
            )}
          </div>

          {nextToken && (
            <div className="border-t border-zinc-800 px-6 py-4">
              <button
                type="button"
                onClick={() => void fetchObjects(nextToken, true)}
                disabled={loadingMore}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>

      {deleteDialog}
    </>
  );
}
