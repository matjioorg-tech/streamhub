'use client';

import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import type { Category } from '@/lib/api/types';
import { CATEGORY_ACCENTS, getCategoryIcon, getSubCategoryLabel } from '@/lib/category-labels';
import { cn } from '@/lib/utils';

interface CategoryRowProps {
  category: Category;
  href?: string;
  starred?: boolean;
  onToggleStar?: () => void;
  className?: string;
}

export function CategoryRow({
  category,
  href,
  starred = false,
  onToggleStar,
  className,
}: CategoryRowProps) {
  const creatorLabel = getSubCategoryLabel(category.name);
  const accent = CATEGORY_ACCENTS[category.name] ?? 'from-zinc-700/40 to-zinc-800/20';
  const linkHref = href ?? `/categories/${category.slug}`;
  const icon = getCategoryIcon(category.name);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-yt-border/60 bg-yt-surface/40 transition duration-200 hover:border-yt-border hover:bg-yt-surface/70',
        className,
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-90',
          accent,
        )}
      />
      <div className="relative flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
        <Link href={linkHref} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yt-bg/50 text-xl ring-1 ring-white/5 sm:h-12 sm:w-12">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-white sm:text-[17px]">
              {category.name}
            </p>
            <p className="mt-0.5 truncate text-sm text-yt-text-secondary">
              {creatorLabel}s in this topic
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-yt-text-tertiary transition group-hover:translate-x-0.5 group-hover:text-white" />
        </Link>
        {onToggleStar && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleStar();
            }}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-yt-text-tertiary transition hover:bg-yt-hover hover:text-white"
            aria-label={starred ? 'Remove from starred' : 'Star category'}
          >
            <Star
              className={cn('h-4 w-4', starred && 'fill-amber-400 text-amber-400')}
              strokeWidth={starred ? 0 : 2}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export function CategoryRowSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-yt-border/60 bg-yt-surface/30 p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-yt-hover" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-yt-hover" />
          <div className="h-3 w-1/2 rounded bg-yt-hover/80" />
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use CategoryRow */
export function CategoryCard(props: CategoryRowProps) {
  return <CategoryRow {...props} />;
}

export function CategoryCardSkeleton() {
  return <CategoryRowSkeleton />;
}
