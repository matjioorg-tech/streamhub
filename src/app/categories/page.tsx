'use client';

import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { useCategories } from '@/hooks/use-categories';
import { CATEGORY_ACCENTS } from '@/lib/category-labels';
import { cn } from '@/lib/utils';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();

  return (
    <PageLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Browse</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {categories?.length ?? 10} categories — pick one to explore creators and videos
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(categories ?? []).map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className={cn(
                'group relative overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br p-4 transition',
                'hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/5',
                CATEGORY_ACCENTS[cat.name] ?? 'from-zinc-800/40 to-zinc-900/40',
              )}
            >
              <h3 className="text-sm font-semibold leading-snug text-white group-hover:text-red-300 sm:text-base">
                {cat.name}
              </h3>
              <p className="mt-2 text-xs text-zinc-500 group-hover:text-zinc-400">View creators →</p>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
