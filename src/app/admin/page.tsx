'use client';

import Link from 'next/link';
import { useAdminDashboard } from '@/hooks/use-admin';

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>
      {isLoading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: 'Total Videos', value: data.totalVideos },
            { label: 'Published', value: data.publishedVideos },
            { label: 'Failed Uploads', value: data.failedUploads },
            { label: 'Pending Uploads', value: data.pendingUploads },
            { label: 'Total Views', value: data.totalViews },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-sm text-zinc-400">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/videos" className="text-red-400 hover:underline">
          Manage videos →
        </Link>
        <Link href="/admin/uploads" className="text-red-400 hover:underline">
          View uploads →
        </Link>
        <Link href="/admin/storage-keys" className="text-red-400 hover:underline">
          Storage keys →
        </Link>
        <Link href="/admin/terabox" className="text-red-400 hover:underline">
          TeraBox cookie →
        </Link>
        <Link href="/admin/invitations" className="text-red-400 hover:underline">
          Invite admins →
        </Link>
      </div>
    </>
  );
}
