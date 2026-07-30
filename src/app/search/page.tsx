import { Suspense } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { SearchContent } from './search-content';

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-48 rounded-xl bg-zinc-800" />
            <div className="h-12 rounded-xl bg-zinc-800" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-video rounded-xl bg-zinc-800" />
              ))}
            </div>
          </div>
        </PageLayout>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
