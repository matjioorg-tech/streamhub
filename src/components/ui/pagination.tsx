'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/lib/api/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i += 1) pages.push(i);

  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

export function Pagination({ meta, onPageChange, className }: PaginationProps) {
  if (meta.totalPages <= 1) return null;

  const pages = getPageNumbers(meta.page, meta.totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-col items-center gap-3 sm:flex-row sm:justify-between', className)}
    >
      <p className="text-xs text-yt-text-tertiary sm:text-sm">
        Showing {(meta.page - 1) * meta.limit + 1}–
        {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.hasPreviousPage}
          aria-label="Previous page"
          className="pro-btn pro-btn-secondary inline-flex h-9 w-9 p-0 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-yt-text-tertiary">
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={page === meta.page ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition',
                  page === meta.page
                    ? 'bg-white text-yt-bg'
                    : 'pro-btn-secondary h-9 min-w-9 p-0',
                )}
              >
                {page}
              </button>
            ),
          )}
        </div>

        <span className="px-2 text-sm text-yt-text-secondary sm:hidden">
          {meta.page} / {meta.totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.hasNextPage}
          aria-label="Next page"
          className="pro-btn pro-btn-secondary inline-flex h-9 w-9 p-0 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
