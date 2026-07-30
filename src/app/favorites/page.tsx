'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { PageHeader } from '@/components/layout/page-header';

export default function FavoritesPage() {
  return (
    <PageLayout>
      <PageHeader
        icon={Heart}
        title="Favorites"
        subtitle="Videos you saved for later"
        accent="red"
      />
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 py-14 text-center">
        <Heart className="mx-auto h-8 w-8 text-zinc-600" />
        <p className="mt-3 text-sm text-zinc-400">Sign in to view your favorites</p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
        >
          Sign in
        </Link>
      </div>
    </PageLayout>
  );
}
