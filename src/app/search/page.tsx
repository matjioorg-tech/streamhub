import { Suspense } from 'react';
import { SearchContent } from './search-content';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-400">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
