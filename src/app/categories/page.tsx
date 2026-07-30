'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, ChevronRight, Grid3X3 } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { PageHeader } from '@/components/layout/page-header';
import { useCategories } from '@/hooks/use-categories';
import { CATEGORY_ACCENTS, getSubCategoryLabel } from '@/lib/category-labels';
import { cn } from '@/lib/utils';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const list = categories ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (cat) =>
        cat.name.toLowerCase().includes(term) ||
        (cat.description?.toLowerCase().includes(term) ?? false),
    );
  }, [categories, query]);

  return (
    <PageLayout>
      <PageHeader
        icon={Grid3X3}
        title="Browse"
        subtitle="Explore categories, creators, and videos"
        accent="emerald"
      />

      <div className="relative mb-5 sm:mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-red-500/60 focus:outline-none sm:max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-900" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 py-14 text-center text-sm text-zinc-500">
          No categories match your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((cat) => {
            const creatorLabel = getSubCategoryLabel(cat.name);
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br p-3.5 transition active:scale-[0.98] sm:p-5',
                  'hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/5',
                  CATEGORY_ACCENTS[cat.name] ?? 'from-zinc-800/40 to-zinc-900/40',
                )}
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-red-300 sm:text-base">
                      {cat.name}
                    </h3>
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/20 text-zinc-400 transition group-hover:bg-red-500/20 group-hover:text-red-300">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  {cat.description && (
                    <p className="mt-2 line-clamp-2 flex-1 text-[11px] text-zinc-500 sm:text-xs">
                      {cat.description}
                    </p>
                  )}
                  <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                    {creatorLabel}s
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
