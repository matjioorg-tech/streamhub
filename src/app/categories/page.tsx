'use client';

import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { useCategories } from '@/hooks/use-categories';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();

  return (
    <PageLayout>
      <h1 className="mb-6 text-2xl font-bold">Categories</h1>
      {isLoading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {(categories ?? []).map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.id}`}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center transition hover:border-red-500"
            >
              <h3 className="font-medium text-white">{cat.name}</h3>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
