'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Category } from '@/lib/api/types';
import { CATEGORY_ACCENTS, getSubCategoryLabel } from '@/lib/category-labels';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: Category;
  href?: string;
  className?: string;
}

export function CategoryCard({ category, href, className }: CategoryCardProps) {
  const creatorLabel = getSubCategoryLabel(category.name);
  const accent = CATEGORY_ACCENTS[category.name] ?? 'from-zinc-700/30 to-zinc-800/20';
  const linkHref = href ?? `/categories/${category.slug}`;

  return (
    <Link
      href={linkHref}
      className={cn(
        'group relative flex min-h-[7.5rem] flex-col justify-between overflow-hidden rounded-2xl border border-yt-border/70 bg-yt-surface/40 p-5 transition duration-200 hover:border-yt-border hover:bg-yt-surface/70 sm:min-h-[8.5rem] sm:p-6',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 transition-opacity group-hover:opacity-100',
          accent,
        )}
      />
      <div className="relative min-w-0 flex-1">
        <p className="text-lg font-semibold leading-snug text-white sm:text-xl">{category.name}</p>
        <p className="mt-1.5 text-sm text-yt-text-secondary">{creatorLabel}s & videos</p>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-yt-text-tertiary">Open library</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-yt-text-tertiary transition group-hover:translate-x-0.5 group-hover:text-white" />
      </div>
    </Link>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="min-h-[7.5rem] animate-pulse rounded-2xl border border-yt-border/60 bg-yt-surface/30 p-5 sm:min-h-[8.5rem] sm:p-6">
      <div className="h-6 w-2/3 rounded-lg bg-yt-hover" />
      <div className="mt-3 h-4 w-1/2 rounded bg-yt-hover/80" />
      <div className="mt-8 h-3 w-1/3 rounded bg-yt-hover/60" />
    </div>
  );
}
