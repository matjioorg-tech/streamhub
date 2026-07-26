'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/api';
import type { B2StorageKey, StorageObject } from '@/lib/api/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

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
  const [objects, setObjects] = useState<StorageObject[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [prefix, setPrefix] = useState('');
  const [searchPrefix, setSearchPrefix] = useState('');
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [viewingKey, setViewingKey] = useState<string | null>(null);

  const allSelected = objects.length > 0 && objects.every((o) => selectedKeys.has(o.key));
  const someSelected = selectedKeys.size > 0;

  const selectedPreview = useMemo(
    () => objects.filter((o) => selectedKeys.has(o.key)).map((o) => o.key),
    [objects, selectedKeys],
  );

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

  const toggleAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(objects.map((o) => o.key)));
    }
  };

  const toggleOne = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchPrefix(prefix.trim());
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

  const handleDelete = async (objectKey: string) => {
    if (!confirm(`Delete "${objectKey}" from B2? This cannot be undone.`)) return;
    setDeletingKey(objectKey);
    setError(null);
    try {
      await adminApi.deleteStorageObject(storageKey.id, objectKey);
      setObjects((prev) => prev.filter((o) => o.key !== objectKey));
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        next.delete(objectKey);
        return next;
      });
      onUsageChanged();
    } catch {
      setError(`Failed to delete "${objectKey}".`);
    } finally {
      setDeletingKey(null);
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedKeys.size;
    if (count === 0) return;

    const preview =
      count <= 3
        ? selectedPreview.map((k) => `• ${k}`).join('\n')
        : `• ${selectedPreview.slice(0, 3).join('\n• ')}\n• …and ${count - 3} more`;

    if (
      !confirm(
        `Delete ${count} object${count === 1 ? '' : 's'} from B2? This cannot be undone.\n\n${preview}`,
      )
    ) {
      return;
    }

    setBulkDeleting(true);
    setError(null);
    try {
      const result = await adminApi.bulkDeleteStorageObjects(storageKey.id, [...selectedKeys]);
      const deletedSet = new Set(
        [...selectedKeys].filter((k) => !result.failed.includes(k)),
      );
      setObjects((prev) => prev.filter((o) => !deletedSet.has(o.key)));
      setSelectedKeys(new Set(result.failed));
      onUsageChanged();
      if (result.failed.length > 0) {
        setError(`Deleted ${result.deleted} object(s). Failed: ${result.failed.length}.`);
      }
    } catch {
      setError('Failed to delete selected objects.');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Storage data — {storageKey.name}</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {storageKey.bucket} · {objects.length} object{objects.length === 1 ? '' : 's'} loaded
            </p>
          </div>
          <div className="flex items-center gap-2">
            {someSelected && (
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {bulkDeleting ? 'Deleting...' : `Delete selected (${selectedKeys.size})`}
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

        <form onSubmit={handleSearch} className="flex gap-2 border-b border-zinc-800 px-6 py-3">
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
                    <td className="max-w-xs truncate p-2 font-mono text-xs text-zinc-300" title={obj.key}>
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
                        onClick={() => handleView(obj.key)}
                        disabled={viewingKey === obj.key || bulkDeleting}
                        className="text-blue-400 hover:underline disabled:opacity-50"
                      >
                        {viewingKey === obj.key ? 'Opening...' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(obj.key)}
                        disabled={deletingKey === obj.key || bulkDeleting}
                        className="text-red-400 hover:underline disabled:opacity-50"
                      >
                        {deletingKey === obj.key ? 'Deleting...' : 'Delete'}
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
              onClick={() => fetchObjects(nextToken, true)}
              disabled={loadingMore}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
