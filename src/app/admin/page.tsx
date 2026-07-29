'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Cloud,
  Clock,
  Eye,
  Film,
  HardDrive,
  Key,
  LayoutDashboard,
  Mail,
  Upload,
} from 'lucide-react';
import {
  useAdminDashboard,
  useConfigureCloudflareCaching,
} from '@/hooks/use-admin';
import type { CloudflareBucketConfigureResult } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const quickLinks = [
  {
    href: '/admin/videos',
    label: 'Manage Videos',
    description: 'Publish, edit, or delete videos',
    icon: Film,
    color: 'text-red-400 bg-red-950/40',
  },
  {
    href: '/admin/uploads',
    label: 'Upload Tasks',
    description: 'Track processing progress',
    icon: Upload,
    color: 'text-blue-400 bg-blue-950/40',
  },
  {
    href: '/admin/storage-keys',
    label: 'Storage Keys',
    description: 'B2 buckets and quotas',
    icon: Key,
    color: 'text-amber-400 bg-amber-950/40',
  },
  {
    href: '/admin/terabox',
    label: 'TeraBox',
    description: 'Cookie and link testing',
    icon: HardDrive,
    color: 'text-purple-400 bg-purple-950/40',
  },
  {
    href: '/admin/invitations',
    label: 'Invite Admins',
    description: 'Send admin invitations',
    icon: Mail,
    color: 'text-green-400 bg-green-950/40',
  },
];

function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="h-3 w-20 rounded bg-zinc-800" />
      <div className="mt-3 h-8 w-14 rounded bg-zinc-800" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();
  const configureCloudflare = useConfigureCloudflareCaching();
  const [cloudflareResults, setCloudflareResults] = useState<
    CloudflareBucketConfigureResult[] | null
  >(null);
  const [cloudflareError, setCloudflareError] = useState<string | null>(null);

  const handleConfigureCloudflare = async () => {
    setCloudflareError(null);
    setCloudflareResults(null);
    try {
      const results = await configureCloudflare.mutateAsync();
      setCloudflareResults(results);
    } catch (err) {
      setCloudflareError(err instanceof Error ? err.message : 'Cloudflare setup failed');
    }
  };

  const stats = data
    ? [
        {
          label: 'Total Videos',
          value: data.totalVideos,
          icon: Film,
          accent: 'text-white',
        },
        {
          label: 'Published',
          value: data.publishedVideos,
          icon: LayoutDashboard,
          accent: 'text-green-400',
        },
        {
          label: 'Failed Uploads',
          value: data.failedUploads,
          icon: AlertTriangle,
          accent: data.failedUploads > 0 ? 'text-red-400' : 'text-white',
        },
        {
          label: 'Pending Uploads',
          value: data.pendingUploads,
          icon: Clock,
          accent: data.pendingUploads > 0 ? 'text-amber-400' : 'text-white',
        },
        {
          label: 'Total Views',
          value: data.totalViews,
          icon: Eye,
          accent: 'text-blue-400',
        },
      ]
    : [];

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Overview of your platform at a glance.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 sm:p-4"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                  <p className="truncate text-xs text-zinc-400 sm:text-sm">{stat.label}</p>
                </div>
                <p className={cn('mt-2 text-xl font-bold sm:text-2xl', stat.accent)}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          CDN & Storage
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-sky-400" />
                <h3 className="font-medium text-white">Configure Cloudflare CDN</h3>
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Applies B2 bucket Cache-Control headers for Cloudflare caching and Bandwidth
                Alliance. Set <code className="text-zinc-300">B2_PUBLIC_URL</code> to your CDN
                subdomain after DNS is ready.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleConfigureCloudflare()}
              disabled={configureCloudflare.isPending}
              className="shrink-0 rounded-lg border border-sky-800 bg-sky-950/40 px-4 py-2.5 text-sm font-medium text-sky-200 transition hover:bg-sky-950/70 disabled:opacity-50"
            >
              {configureCloudflare.isPending ? 'Configuring...' : 'Configure B2 for Cloudflare'}
            </button>
          </div>

          {cloudflareError && (
            <p className="mt-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {cloudflareError}
            </p>
          )}

          {cloudflareResults && cloudflareResults.length > 0 && (
            <ul className="mt-4 space-y-2">
              {cloudflareResults.map((result) => (
                <li
                  key={result.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm"
                >
                  <span className="text-zinc-300">
                    {result.name}{' '}
                    <span className="text-zinc-500">({result.bucket})</span>
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      result.status === 'updated' && 'bg-green-950 text-green-300',
                      result.status === 'skipped' && 'bg-zinc-800 text-zinc-400',
                      result.status === 'failed' && 'bg-red-950 text-red-300',
                    )}
                  >
                    {result.status}
                  </span>
                  <span className="w-full text-xs text-zinc-500 sm:w-auto">{result.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Quick Actions
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(({ href, label, description, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors active:bg-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  color,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{label}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500 sm:text-sm">
                  {description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
