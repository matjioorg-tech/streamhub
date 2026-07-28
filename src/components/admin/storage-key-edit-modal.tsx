'use client';

import { FormEvent, useState } from 'react';
import { useTestStorageKeyById, useUpdateStorageKey } from '@/hooks/use-admin';
import type { B2StorageKey, UpdateB2StorageKeyInput } from '@/lib/api/types';

interface StorageKeyEditModalProps {
  storageKey: B2StorageKey;
  onClose: () => void;
  onSaved: () => void;
}

export function StorageKeyEditModal({ storageKey, onClose, onSaved }: StorageKeyEditModalProps) {
  const updateKey = useUpdateStorageKey();
  const testKey = useTestStorageKeyById();

  const [name, setName] = useState(storageKey.name);
  const [endpoint, setEndpoint] = useState(storageKey.endpoint);
  const [region, setRegion] = useState(storageKey.region);
  const [bucket, setBucket] = useState(storageKey.bucket);
  const [bucketId, setBucketId] = useState(storageKey.bucketId ?? '');
  const [accessKey, setAccessKey] = useState(storageKey.accessKey);
  const [secretKey, setSecretKey] = useState('');
  const [publicUrl, setPublicUrl] = useState(storageKey.publicUrl ?? '');
  const [quotaGb, setQuotaGb] = useState(storageKey.quotaBytes / 1024 ** 3);
  const [isActive, setIsActive] = useState(storageKey.isActive);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildUpdatePayload = (): UpdateB2StorageKeyInput => {
    const payload: UpdateB2StorageKeyInput = {
      name,
      endpoint,
      region,
      bucket,
      bucketId: bucketId.trim() || undefined,
      accessKey,
      publicUrl: publicUrl.trim() || undefined,
      quotaBytes: Math.floor(quotaGb * 1024 ** 3),
      isActive,
    };
    if (secretKey.trim()) {
      payload.secretKey = secretKey;
    }
    return payload;
  };

  const handleTest = async () => {
    setMessage(null);
    setError(null);
    try {
      const payload = buildUpdatePayload();
      await testKey.mutateAsync({ id: storageKey.id, input: payload });
      setMessage('Connection successful — credentials are valid.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection test failed');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await updateKey.mutateAsync({ id: storageKey.id, input: buildUpdatePayload() });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update storage key');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit storage key</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Priority {storageKey.priority} — auto-assigned from free space after save.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Close
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-green-800 bg-green-950/50 px-4 py-3 text-sm text-green-300">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-zinc-400">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-zinc-400">S3 Endpoint</span>
            <input
              required
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Region</span>
            <input
              required
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Bucket</span>
            <input
              required
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Bucket ID (optional)</span>
            <input
              value={bucketId}
              onChange={(e) => setBucketId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Access Key ID</span>
            <input
              required
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-zinc-400">
              Application Key (secret)
            </span>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={`Leave blank to keep ${storageKey.secretKeyPreview}`}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Quota (GB)</span>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={quotaGb}
              onChange={(e) => setQuotaGb(parseFloat(e.target.value) || quotaGb)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Public URL (optional)</span>
            <input
              value={publicUrl}
              onChange={(e) => setPublicUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-zinc-600"
            />
            <span className="text-zinc-300">Active (available for new uploads)</span>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testKey.isPending}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-900 disabled:opacity-50"
          >
            {testKey.isPending ? 'Testing…' : 'Test connection'}
          </button>
          <button
            type="submit"
            disabled={updateKey.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {updateKey.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
