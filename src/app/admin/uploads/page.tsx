'use client';

import { useAdminUploads } from '@/hooks/use-admin';
import { adminApi } from '@/lib/api';

export default function AdminUploadsPage() {
  const { data: uploads, isLoading, refetch } = useAdminUploads();

  const handleRetry = async (taskId: string) => {
    await adminApi.retryUpload(taskId);
    refetch();
  };

  const uploadList = uploads ?? [];

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Upload Tasks</h1>
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
                {task.error && (
                  <p className="mt-2 break-words text-sm text-red-400">{task.error}</p>
                )}
                {task.status === 'failed' && (
                  <button
                    type="button"
                    onClick={() => handleRetry(task.id)}
                    className="mt-3 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400"
                  >
                    Retry
                  </button>
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
                  <th className="p-3">Actions</th>
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
                    <td className="p-3">
                      {task.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(task.id)}
                          className="text-red-400 hover:underline"
                        >
                          Retry
                        </button>
                      )}
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
