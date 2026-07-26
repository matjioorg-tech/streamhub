'use client';

import { useAdminUploads } from '@/hooks/use-admin';
import { adminApi } from '@/lib/api';

export default function AdminUploadsPage() {
  const { data: uploads, isLoading, refetch } = useAdminUploads();

  const handleRetry = async (taskId: string) => {
    await adminApi.retryUpload(taskId);
    refetch();
  };

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Upload Tasks</h1>
      {isLoading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 text-zinc-400">
              <tr>
                <th className="p-3">Video</th>
                <th className="p-3">Status</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Error</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(uploads ?? []).map((task) => (
                <tr key={task.id} className="border-b border-zinc-800">
                  <td className="p-3">{task.video?.title ?? task.videoId}</td>
                  <td className="p-3">
                    <span className="rounded bg-zinc-800 px-2 py-1 text-xs">{task.status}</span>
                  </td>
                  <td className="p-3">{task.progress}%</td>
                  <td className="p-3 text-red-400">{task.error ?? '-'}</td>
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
      )}
    </>
  );
}
