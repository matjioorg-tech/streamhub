'use client';

import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';

export default function ProfilePage() {
  return (
    <PageLayout>
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
      <div className="space-y-4">
        <Link href="/history" className="block rounded-lg border border-zinc-800 p-4 hover:border-red-500">
          Watch History
        </Link>
        <Link href="/favorites" className="block rounded-lg border border-zinc-800 p-4 hover:border-red-500">
          Favorites
        </Link>
      </div>
    </PageLayout>
  );
}
