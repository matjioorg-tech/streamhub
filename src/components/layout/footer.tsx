import { cn } from '@/lib/utils';

export function Footer({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={cn(
        'mt-auto border-t border-zinc-800 bg-zinc-950',
        compact ? 'py-4 md:py-8' : 'py-8',
      )}
    >
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} StreamHub. All rights reserved.</p>
      </div>
    </footer>
  );
}
