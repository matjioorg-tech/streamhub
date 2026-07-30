'use client';

import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import type { SubCategory } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface CreatorSelectProps {
  creatorLabel: string;
  subcategories: SubCategory[];
  selectedSub?: string;
  isLoading: boolean;
  onSelect: (creatorName: string | undefined) => void;
  className?: string;
}

/** Compact native-style creator filter — one row, no card grid. */
export function CreatorSelect({
  creatorLabel,
  subcategories,
  selectedSub,
  isLoading,
  onSelect,
  className,
}: CreatorSelectProps) {
  return (
    <label className={cn('relative block min-w-0 flex-1', className)}>
      <span className="sr-only">{creatorLabel}</span>
      <select
        disabled={isLoading}
        value={selectedSub ?? ''}
        onChange={(e) => {
          const value = e.target.value || undefined;
          onSelect(value);
        }}
        className="w-full truncate rounded-lg border border-zinc-800 bg-zinc-900/90 py-2 pl-3 pr-8 text-sm text-white focus:border-red-500/50 focus:outline-none disabled:opacity-60"
      >
        <option value="">{isLoading ? `Loading…` : `All ${creatorLabel.toLowerCase()}s`}</option>
        {subcategories.map((sub) => (
          <option key={sub.slug} value={sub.name}>
            {sub.name} ({sub.videoCount})
          </option>
        ))}
      </select>
    </label>
  );
}

interface CreatorSidebarProps {
  creatorLabel: string;
  subcategories: SubCategory[];
  selectedSub?: string;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  buildHref: (creatorName?: string) => string;
  onSelect: (creatorName: string | undefined) => void;
}

/** Desktop-only compact creator list. */
export function CreatorSidebar({
  creatorLabel,
  subcategories,
  selectedSub,
  isLoading,
  search,
  onSearchChange,
  buildHref,
  onSelect,
}: CreatorSidebarProps) {
  return (
    <aside className="hidden w-52 shrink-0 lg:block xl:w-56">
      <div className="sticky top-[4.5rem] rounded-lg border border-zinc-800/80 bg-zinc-950/60">
        <div className="border-b border-zinc-800/80 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {creatorLabel}s
          </p>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-1.5 pl-8 pr-2 text-xs text-white placeholder:text-zinc-500 focus:border-red-500/50 focus:outline-none"
            />
          </div>
        </div>
        <nav className="max-h-[50vh] overflow-y-auto p-1.5">
          <Link
            href={buildHref()}
            onClick={() => onSelect(undefined)}
            className={cn(
              'flex items-center justify-between rounded-md px-2.5 py-2 text-xs transition',
              !selectedSub
                ? 'bg-red-500/15 font-medium text-red-300'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
            )}
          >
            <span>All</span>
          </Link>
          {isLoading ? (
            <p className="px-2.5 py-3 text-xs text-zinc-500">Loading…</p>
          ) : subcategories.length === 0 ? (
            <p className="px-2.5 py-3 text-xs text-zinc-500">No results</p>
          ) : (
            subcategories.map((sub) => {
              const active = selectedSub?.toLowerCase() === sub.name.toLowerCase();
              return (
                <Link
                  key={sub.slug}
                  href={buildHref(sub.name)}
                  onClick={() => onSelect(sub.name)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs transition',
                    active
                      ? 'bg-red-500/15 font-medium text-red-300'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
                  )}
                >
                  <span className="truncate">{sub.name}</span>
                  <span className="shrink-0 tabular-nums text-zinc-600">{sub.videoCount}</span>
                </Link>
              );
            })
          )}
        </nav>
      </div>
    </aside>
  );
}
