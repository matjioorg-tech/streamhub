'use client';

import { useState } from 'react';
import { useAdminUploads, useClearUploadTempDir, useUploadTempDirStats } from '@/hooks/use-admin';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function AdminUploadsPage() {
  const { data: uploads, isLoading } = useAdminUploads();
  const { data: tempDir, isLoading: tempLoading, refetch: refetchTemp } = useUploadTempDirStats();
  const clearTempDir = useClearUploadTempDir();
  const [confirmClear, setConfirmClear] = useState(false);

  const uploadList = uploads ?? [];

  const handleClearTemp = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }

    await clearTempDir.mutateAsync();
    setConfirmClear(false);
    await refetchTemp();
  };

  return (
    <>
      <h1 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">Upload Tasks</h1>

      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-medium text-white">Upload temp storage</h2>
            <p className="mt-1 break-all text-sm text-zinc-400">
              {tempLoading ? 'Loading path...' : (tempDir?.path ?? '/tmp/video-platform')}
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              {tempLoading ? (
                'Calculating size...'
              ) : tempDir ? (
                <>
                  <span className="font-semibold text-white">{formatBytes(tempDir.bytes)}</span>
                  {' · '}
                  {tempDir.fileCount} file{tempDir.fileCount === 1 ? '' : 's'}
                  {' · '}
                  {tempDir.directoryCount} folder{tempDir.directoryCount === 1 ? '' : 's'}
                  {!tempDir.exists && ' · directory missing'}
                </>
              ) : (
                'Unable to load temp directory stats'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleClearTemp()}
            disabled={clearTempDir.isPending || tempLoading}
            className={`w-full shrink-0 rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 sm:w-auto sm:py-2 ${
              confirmClear
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            {clearTempDir.isPending
              ? 'Clearing...'
              : confirmClear
                ? 'Confirm delete temp folder'
                : 'Delete temp folder'}
          </button>
        </div>
        {confirmClear && !clearTempDir.isPending && (
          <p className="mt-3 text-sm text-amber-400">
            This removes all temporary upload files on the processing server. Click again to confirm.
          </p>
        )}
        {clearTempDir.isError && (
          <p className="mt-3 text-sm text-red-400">Failed to clear temp folder. Try again.</p>
        )}
      </div>

      {isLoading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="space-y-3 md:hidden">
            {uploadList.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <p className="font-medium leading-snug text-white">
                  {task.video?.title ?? task.videoId}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">{task.status}</span>
                  <span className="text-sm text-zinc-400">{task.progress}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all"
                    style={{ width: `${Math.min(100, task.progress)}%` }}
                  />
                </div>
                {task.error && (
                  <p className="mt-2 break-words text-sm text-red-400">{task.error}</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-zinc-800 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="p-3">Video</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {uploadList.map((task) => (
                  <tr key={task.id} className="border-b border-zinc-800">
                    <td className="max-w-[240px] truncate p-3">
                      {task.video?.title ?? task.videoId}
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-zinc-800 px-2 py-1 text-xs">{task.status}</span>
                    </td>
                    <td className="p-3">{task.progress}%</td>
                    <td className="max-w-xs break-words p-3 text-red-400">
                      {task.error ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
