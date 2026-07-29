'use client';

import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['categories', slug],
    queryFn: () => categoriesApi.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useSubcategories(categorySlug: string, search?: string) {
  return useQuery({
    queryKey: ['categories', categorySlug, 'subcategories', search ?? ''],
    queryFn: () => categoriesApi.listSubcategories(categorySlug, search),
    enabled: !!categorySlug,
  });
}
