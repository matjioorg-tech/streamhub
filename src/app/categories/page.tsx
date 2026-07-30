'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';
import { useCategories } from '@/hooks/use-categories';
import { getSubCategoryLabel } from '@/lib/category-labels';
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
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white sm:text-xl">Browse</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            {categories?.length ?? 0} categories
          </p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories…"
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-red-500/50 focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800/80">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3.5">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 animate-pulse rounded bg-zinc-800" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-500">
          No categories match your search.
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/80 overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950/40">
          {filtered.map((cat) => {
            const creatorLabel = getSubCategoryLabel(cat.name);
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group flex items-center gap-3 px-3 py-3 transition active:bg-zinc-900/80 hover:bg-zinc-900/50"
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-[11px] font-bold uppercase text-red-400 ring-1 ring-zinc-800',
                  )}
                >
                  {cat.name.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white group-hover:text-red-300">
                    {cat.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{creatorLabel}s</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-zinc-400" />
              </Link>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
