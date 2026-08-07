'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers3 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { playlistsApi } from '@/lib/api';
import type { PlaylistDetail } from '@/lib/api/types';
import { BatchVideoRow } from '@/components/batch/batch-video-row';

export default function BatchDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [batch, setBatch] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    playlistsApi
      .getBySlug(slug)
      .then(setBatch)
      .catch(() => setError('Batch not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <PageLayout>
      <div className="mb-6">
        <Link
          href="/profile/batches"
          className="inline-flex items-center gap-2 text-sm text-yt-text-secondary hover:text-yt-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to batches
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-yt-border bg-yt-surface p-8 text-center text-yt-text-secondary">
          Loading batch...
        </div>
      ) : error || !batch ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error ?? 'Batch not found'}
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-yt-text">{batch.title}</h1>
              <p className="mt-1 text-sm text-yt-text-secondary">
                {batch.videoCount} video{batch.videoCount === 1 ? '' : 's'}
                {batch.category ? ` · ${batch.category.name}` : ''}
                {batch.author ? ` · ${batch.author}` : ''}
              </p>
              {batch.description ? (
                <p className="mt-3 max-w-2xl text-sm text-yt-text-secondary">{batch.description}</p>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-yt-border bg-yt-surface">
            <table className="w-full">
              <thead>
                <tr className="border-b border-yt-border text-left text-xs uppercase tracking-wide text-yt-text-secondary">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Video</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {batch.videos.map((video, index) => (
                  <BatchVideoRow key={video.id} video={video} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageLayout>
  );
}
