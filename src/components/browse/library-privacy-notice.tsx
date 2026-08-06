import { Lock } from 'lucide-react';

export function LibraryPrivacyNotice({ className }: { className?: string }) {
  return (
    <div
      className={`flex gap-3 rounded-xl border border-yt-border/60 bg-yt-surface/50 px-4 py-3.5 ${className ?? ''}`}
    >
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-yt-text-tertiary" aria-hidden />
      <p className="text-sm leading-relaxed text-yt-text-secondary">
        This library is private to you. Your videos are not visible to others and do not appear in
        public search.
      </p>
    </div>
  );
}
