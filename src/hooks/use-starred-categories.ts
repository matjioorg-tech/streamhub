'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'streamhub-starred-categories';

function readStarred(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function useStarredCategories() {
  const [starred, setStarred] = useState<string[]>([]);

  useEffect(() => {
    setStarred(readStarred());
  }, []);

  const toggleStar = useCallback((slug: string) => {
    setStarred((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isStarred = useCallback((slug: string) => starred.includes(slug), [starred]);

  return { starred, toggleStar, isStarred };
}
