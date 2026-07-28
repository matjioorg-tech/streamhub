'use client';

import { FormEvent, useState } from 'react';
import {
  useStorageKeys,
  useCreateStorageKey,
  useTestStorageKey,
  useSyncStorageKeyUsage,
  useSyncAllStorageKeyUsage,
  useDeactivateStorageKey,
} from '@/hooks/use-admin';
import type { CreateB2StorageKeyInput, B2StorageKey } from '@/lib/api/types';
import { StorageDataModal } from '@/components/admin/storage-data-modal';
import { StorageKeyEditModal } from '@/components/admin/storage-key-edit-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatBytes } from '@/lib/utils';

const DEFAULT_QUOTA_GB = 9.5;

const emptyForm: CreateB2StorageKeyInput = {
  name: '',
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  region: 'us-east-005',
  bucket: '',
  accessKey: '',
  secretKey: '',
  publicUrl: '',
};

export default function AdminStorageKeysPage() {
  const { data: keys, isLoading, refetch } = useStorageKeys();
  const createKey = useCreateStorageKey();
  const testKey = useTestStorageKey();
  const syncUsage = useSyncStorageKeyUsage();
  const syncAllUsage = useSyncAllStorageKeyUsage();
  const deactivate = useDeactivateStorageKey();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateB2StorageKeyInput>(emptyForm);
  const [quotaGb, setQuotaGb] = useState(DEFAULT_QUOTA_GB);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingKey, setViewingKey] = useState<B2StorageKey | null>(null);
  const [editingKey, setEditingKey] = useState<B2StorageKey | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const updateField = (field: keyof CreateB2StorageKeyInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = (): CreateB2StorageKeyInput => ({
    ...form,
    publicUrl: form.publicUrl?.trim() || undefined,
    bucketId: form.bucketId?.trim() || undefined,
    quotaBytes: Math.floor(quotaGb * 1024 ** 3),
  });

  const handleTest = async () => {
    setMessage(null);
    setError(null);
    try {
      await testKey.mutateAsync(buildPayload());
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
      await createKey.mutateAsync(buildPayload());
      setForm(emptyForm);
      setQuotaGb(DEFAULT_QUOTA_GB);
      setShowForm(false);
      setMessage('Storage key added successfully.');
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add storage key');
    }
  };

  const handleSync = async (id: string) => {
    setMessage(null);
    setError(null);
    try {
      await syncUsage.mutateAsync(id);
      setMessage('Usage synced from B2.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  };

  const handleSyncAll = async () => {
    setMessage(null);
    setError(null);
    try {
      const synced = await syncAllUsage.mutateAsync();
      setMessage(`Synced usage for ${synced.length} storage key(s) from B2.`);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync all failed');
    }
  };

  const runDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivate.mutateAsync(deactivateTarget.id);
      setMessage(`"${deactivateTarget.name}" deactivated.`);
      setDeactivateTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate');
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Backblaze Storage Keys</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Each key has a 9.5 GB quota. Priority is auto-assigned — buckets with the most free space are used first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {keys && keys.length > 0 && (
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={syncAllUsage.isPending}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
            >
              {syncAllUsage.isPending ? 'Syncing...' : 'Sync all'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            {showForm ? 'Cancel' : 'Add API Key'}
          </button>
        </div>
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

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/80 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold">New B2 API Key</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-400">Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="B2 Key #2"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block text-zinc-400">S3 Endpoint</span>
              <input
                required
                value={form.endpoint}
                onChange={(e) => updateField('endpoint', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-400">Region</span>
              <input
                required
                value={form.region}
                onChange={(e) => updateField('region', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-400">Bucket</span>
              <input
                required
                value={form.bucket}
                onChange={(e) => updateField('bucket', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-400">Access Key ID</span>
              <input
                required
                value={form.accessKey}
                onChange={(e) => updateField('accessKey', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-400">Application Key (secret)</span>
              <input
                required
                type="password"
                value={form.secretKey}
                onChange={(e) => updateField('secretKey', e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-400">Quota (GB)</span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={quotaGb}
                onChange={(e) => setQuotaGb(parseFloat(e.target.value) || DEFAULT_QUOTA_GB)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-400">Public URL (optional)</span>
              <input
                value={form.publicUrl ?? ''}
                onChange={(e) => updateField('publicUrl', e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
              />
            </label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleTest}
              disabled={testKey.isPending}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
            >
              {testKey.isPending ? 'Testing…' : 'Test connection'}
            </button>
            <button
              type="submit"
              disabled={createKey.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              {createKey.isPending ? 'Saving…' : 'Save key'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : !keys?.length ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
          No storage keys yet. Add your first B2 API key above.
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <div
              key={key.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white">{key.name}</h3>
                  <p className="mt-1 font-mono text-xs text-zinc-500">
                    {key.accessKey} · secret {key.secretKeyPreview}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {key.bucket} · {key.endpoint}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      key.isActive ? 'bg-green-900/50 text-green-300' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {key.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      key.isWritable ? 'bg-blue-900/50 text-blue-300' : 'bg-amber-900/50 text-amber-300'
                    }`}
                  >
                    {key.isWritable ? 'Writable' : 'Full'}
                  </span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                    Priority {key.priority} (auto)
                  </span>
                </div>
              </div>

              <div className="mb-2 flex justify-between text-sm">
                <span className="text-zinc-400">
                  {formatBytes(key.usageBytes)} / {formatBytes(key.quotaBytes)}
                </span>
                <span
                  className={
                    key.usagePercent >= 95 ? 'text-amber-400' : 'text-zinc-400'
                  }
                >
                  {key.usagePercent.toFixed(1)}%
                </span>
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    key.usagePercent >= 95
                      ? 'bg-amber-500'
                      : key.usagePercent >= 80
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, key.usagePercent)}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditingKey(key)}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setViewingKey(key)}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800"
                >
                  View data
                </button>
                <button
                  type="button"
                  onClick={() => handleSync(key.id)}
                  disabled={syncUsage.isPending}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800 disabled:opacity-50"
                >
                  Sync usage from B2
                </button>
                {key.isActive && (
                  <button
                    type="button"
                    onClick={() => setDeactivateTarget({ id: key.id, name: key.name })}
                    disabled={deactivate.isPending}
                    className="rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950 disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingKey && (
        <StorageKeyEditModal
          storageKey={editingKey}
          onClose={() => setEditingKey(null)}
          onSaved={() => {
            setMessage(`"${editingKey.name}" updated.`);
            refetch();
          }}
        />
      )}

      {viewingKey && (
        <StorageDataModal
          storageKey={viewingKey}
          onClose={() => setViewingKey(null)}
          onUsageChanged={() => refetch()}
        />
      )}

      {deactivateTarget && (
        <ConfirmDialog
          title={`Deactivate "${deactivateTarget.name}"?`}
          description="Existing videos on this key will still play. New uploads will skip this key."
          confirmLabel="Deactivate"
          loading={deactivate.isPending}
          onCancel={() => setDeactivateTarget(null)}
          onConfirm={() => void runDeactivate()}
        />
      )}
    </>
  );
}
