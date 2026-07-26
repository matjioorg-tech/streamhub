'use client';

import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });
}
