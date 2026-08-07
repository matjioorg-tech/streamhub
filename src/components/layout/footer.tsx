import { cn } from '@/lib/utils';

export function Footer({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <footer
      className={cn(
        'mt-auto border-t border-yt-border/80 bg-yt-bg',
        compact ? 'py-4 md:py-6' : 'py-8',
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-yt-text-tertiary">
        <p>&copy; {new Date().getFullYear()} StreamHub. All rights reserved.</p>
      </div>
    </footer>
  );
}
