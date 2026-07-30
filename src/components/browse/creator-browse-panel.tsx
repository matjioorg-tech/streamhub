'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, User, X } from 'lucide-react';
import type { SubCategory } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface CreatorBrowsePanelProps {
  creatorLabel: string;
  subcategories: SubCategory[];
  selectedSub?: string;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (creatorName: string | undefined) => void;
  buildHref: (creatorName?: string) => string;
}

function CreatorAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500/30 to-zinc-800 text-sm font-semibold text-white ring-1 ring-zinc-700">
      {initial}
    </span>
  );
}

function CreatorRow({
  name,
  videoCount,
  active,
  onClick,
}: {
  name: string;
  videoCount: number;
  active: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <CreatorAvatar name={name} />
      <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
      <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
        {videoCount}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
          active
            ? 'bg-red-500/15 font-medium text-red-300 ring-1 ring-red-500/30'
            : 'text-zinc-300 hover:bg-zinc-900',
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5',
        active && 'bg-red-500/15 font-medium text-red-300 ring-1 ring-red-500/30',
      )}
    >
      {content}
    </div>
  );
}

export function CreatorBrowsePanel({
  creatorLabel,
  subcategories,
  selectedSub,
  isLoading,
  search,
  onSearchChange,
  onSelect,
  buildHref,
}: CreatorBrowsePanelProps) {
  const listId = useId();
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sheetOpen) {
      const timer = window.setTimeout(() => searchRef.current?.focus(), 120);
      return () => window.clearTimeout(timer);
    }
  }, [sheetOpen]);

  const selectedCreator = subcategories.find(
    (sub) => sub.name.toLowerCase() === selectedSub?.toLowerCase(),
  );

  const creatorGrid = (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-1">
      <Link
        href={buildHref()}
        onClick={() => {
          onSelect(undefined);
          setSheetOpen(false);
        }}
        className={cn(
          'flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition lg:flex-row lg:px-3 lg:py-2.5 lg:text-left',
          !selectedSub
            ? 'border-red-500/40 bg-red-500/10 text-red-300'
            : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900',
        )}
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700">
          <User className="h-4 w-4" />
        </span>
        <div className="min-w-0 lg:flex-1">
          <p className="truncate text-sm font-medium">All videos</p>
          <p className="mt-0.5 text-xs text-zinc-500 lg:hidden">Browse everything</p>
        </div>
      </Link>

      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-xl bg-zinc-900 lg:h-12" />
        ))
      ) : subcategories.length === 0 ? (
        <p className="col-span-full px-2 py-6 text-center text-sm text-zinc-500">
          No {creatorLabel.toLowerCase()}s found
        </p>
      ) : (
        subcategories.map((sub) => {
          const active = selectedSub?.toLowerCase() === sub.name.toLowerCase();
          return (
            <Link
              key={sub.slug}
              href={buildHref(sub.name)}
              onClick={() => {
                onSelect(sub.name);
                setSheetOpen(false);
              }}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition lg:hidden',
                active
                  ? 'border-red-500/40 bg-red-500/10 text-red-300'
                  : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900',
              )}
            >
              <CreatorAvatar name={sub.name} />
              <div className="min-w-0 w-full">
                <p className="truncate text-sm font-medium">{sub.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{sub.videoCount} videos</p>
              </div>
            </Link>
          );
        })
      )}

      {!isLoading &&
        subcategories.map((sub) => {
          const active = selectedSub?.toLowerCase() === sub.name.toLowerCase();
          return (
            <Link
              key={`desktop-${sub.slug}`}
              href={buildHref(sub.name)}
              onClick={() => onSelect(sub.name)}
              className="hidden lg:block"
            >
              <CreatorRow name={sub.name} videoCount={sub.videoCount} active={active} />
            </Link>
          );
        })}
    </div>
  );

  return (
    <>
      {/* Mobile: dynamic picker + quick grid */}
      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={sheetOpen}
          aria-controls={listId}
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-left shadow-sm"
        >
          {selectedCreator ? (
            <CreatorAvatar name={selectedCreator.name} />
          ) : (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
              <User className="h-4 w-4" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-zinc-500">{creatorLabel}</span>
            <span className="block truncate text-sm font-medium text-white">
              {selectedCreator?.name ?? `All ${creatorLabel.toLowerCase()}s`}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
        </button>

        {!selectedSub && (
          <section className="mt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">{creatorLabel}s</h2>
              <div className="relative min-w-0 flex-1 max-w-[180px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={`Search...`}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-1.5 pl-8 pr-2 text-xs text-white placeholder:text-zinc-500 focus:border-red-500/60 focus:outline-none"
                />
              </div>
            </div>
            {creatorGrid}
          </section>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-full shrink-0 lg:block lg:w-72 xl:w-80">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 lg:sticky lg:top-20">
          <div className="border-b border-zinc-800 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {creatorLabel}s
            </p>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={`Search ${creatorLabel.toLowerCase()}s...`}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-red-500/60 focus:outline-none"
              />
            </div>
          </div>
          <nav className="max-h-[min(60vh,520px)] overflow-y-auto p-2">{creatorGrid}</nav>
        </div>
      </aside>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div
            id={listId}
            role="dialog"
            aria-modal="true"
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div>
                <p className="text-xs text-zinc-500">{creatorLabel}s</p>
                <p className="text-sm font-semibold text-white">Choose a {creatorLabel.toLowerCase()}</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-zinc-800 px-4 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={`Search ${creatorLabel.toLowerCase()}s...`}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-red-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <Link
                href={buildHref()}
                onClick={() => {
                  onSelect(undefined);
                  setSheetOpen(false);
                }}
                className={cn(
                  'mb-2 flex items-center gap-3 rounded-xl px-3 py-3 transition',
                  !selectedSub
                    ? 'bg-red-500/15 font-medium text-red-300'
                    : 'text-zinc-300 hover:bg-zinc-900',
                )}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                  <User className="h-4 w-4" />
                </span>
                <span className="text-sm">All videos</span>
              </Link>

              {isLoading ? (
                <p className="px-3 py-4 text-sm text-zinc-500">Loading...</p>
              ) : (
                subcategories.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={buildHref(sub.name)}
                    onClick={() => {
                      onSelect(sub.name);
                      setSheetOpen(false);
                    }}
                    className="block"
                  >
                    <CreatorRow
                      name={sub.name}
                      videoCount={sub.videoCount}
                      active={selectedSub?.toLowerCase() === sub.name.toLowerCase()}
                    />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
