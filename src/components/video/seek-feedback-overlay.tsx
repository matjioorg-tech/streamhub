'use client';

import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeekFeedbackOverlayProps {
  direction: 'back' | 'forward';
  seconds: number;
  animationKey: number;
}

export function SeekFeedbackOverlay({
  direction,
  seconds,
  animationKey,
}: SeekFeedbackOverlayProps) {
  const isBack = direction === 'back';
  const Icon = isBack ? ChevronsLeft : ChevronsRight;

  return (
    <div
      key={animationKey}
      className={cn(
        'pointer-events-none absolute top-1/2 z-30 -translate-y-1/2',
        isBack ? 'left-[22%] -translate-x-1/2' : 'right-[22%] translate-x-1/2',
      )}
    >
      <div className="seek-feedback-burst relative">
        <span className="seek-feedback-ripple absolute -inset-3 rounded-2xl bg-white/20" />
        <div className="relative flex min-w-[72px] flex-col items-center gap-0.5 rounded-2xl bg-black/65 px-4 py-3 text-white shadow-xl shadow-black/50 backdrop-blur-md">
          <Icon className="h-7 w-7 stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round" />
          <span className="text-sm font-bold tabular-nums leading-none">{seconds}s</span>
        </div>
      </div>
    </div>
  );
}
