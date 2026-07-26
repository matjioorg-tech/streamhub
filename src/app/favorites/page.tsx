'use client';

import { PageLayout } from '@/components/layout/page-layout';

export default function FavoritesPage() {
  return (
    <PageLayout>
      <h1 className="mb-6 text-2xl font-bold">Favorites</h1>
      <p className="text-zinc-400">Sign in to view your favorites.</p>
    </PageLayout>
  );
}
