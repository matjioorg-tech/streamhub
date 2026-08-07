'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Layers3 } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { PageHeader } from '@/components/layout/page-header';
import { playlistsApi } from '@/lib/api';
import type { PlaylistSummary } from '@/lib/api/types';
import { formatRelativeTime } from '@/lib/utils';

function BatchCard({ batch }: { batch: PlaylistSummary }) {
  return (
    <Link
      href={`/profile/batches/${batch.slug}`}
      className="group flex items-center gap-4 rounded-xl border border-yt-border bg-yt-surface p-4 transition hover:border-yt-border-strong hover:bg-yt-hover/40"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20">
        <Layers3 className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-medium text-yt-text group-hover:text-white">
              {batch.title}
            </h2>
            <p className="mt-1 text-sm text-yt-text-secondary">
              {batch.videoCount} video{batch.videoCount === 1 ? '' : 's'}
              {batch.category ? ` · ${batch.category.name}` : ''}
              {batch.author ? ` · ${batch.author}` : ''}
            </p>
          </div>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-yt-text-secondary opacity-0 transition group-hover:opacity-100" />
        </div>
        <p className="mt-2 text-xs text-yt-text-secondary">
          Updated {formatRelativeTime(batch.updatedAt)}
          {batch.batchSource ? ` · via ${batch.batchSource}` : ''}
        </p>
      </div>
    </Link>
  );
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    playlistsApi
      .listMine()
      .then(setBatches)
      .catch(() => setError('Failed to load batches'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageLayout>
      <PageHeader
        icon={Layers3}
        title="My Courses / Batches"
        subtitle="Grouped uploads from Telegram caption batches, /batch sessions, or albums."
        accent="violet"
      />

      {loading ? (
        <div className="rounded-xl border border-yt-border bg-yt-surface p-8 text-center text-yt-text-secondary">
          Loading batches...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">{error}</div>
      ) : batches.length === 0 ? (
        <div className="rounded-xl border border-yt-border bg-yt-surface p-8 text-center">
          <Layers3 className="mx-auto h-10 w-10 text-yt-text-secondary" />
          <h2 className="mt-4 text-lg font-medium text-yt-text">No batches yet</h2>
          <p className="mt-2 text-sm text-yt-text-secondary">
            Group uploads from Telegram using caption batches, /batch sessions, or albums. Set your
            preferred mode in Profile.
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
          >
            Go to Profile
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {batches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </div>
      )}
    </PageLayout>
  );
}
