'use client';

import { cn } from '@/lib/utils';

interface SeekFeedbackOverlayProps {
  direction: 'back' | 'forward';
  seconds: number;
  animationKey: number;
}

export function SeekDirectionIcon({
  direction,
  seconds,
  className,
}: {
  direction: 'back' | 'forward';
  seconds: number;
  className?: string;
}) {
  const isBack = direction === 'back';
  const label = String(seconds);

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {isBack ? (
        <>
          <path
            d="M24 9.5a14.5 14.5 0 1 0 10.2 4.2"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M13.5 7.5v8.5h8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M24 9.5a14.5 14.5 0 1 1 10.2 4.2"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M34.5 7.5v8.5h-8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      <text
        x="24"
        y="34"
        textAnchor="middle"
        fill="currentColor"
        fontSize={label.length > 2 ? '10' : '12'}
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

export function SeekFeedbackOverlay({
  direction,
  seconds,
  animationKey,
}: SeekFeedbackOverlayProps) {
  return (
    <div
      key={animationKey}
      className={cn(
        'pointer-events-none absolute top-1/2 z-30 -translate-y-1/2',
        direction === 'back' ? 'left-[20%] -translate-x-1/2' : 'right-[20%] translate-x-1/2',
      )}
    >
      <div className="seek-feedback-burst relative flex h-[76px] w-[76px] items-center justify-center sm:h-[88px] sm:w-[88px]">
        <span className="seek-feedback-ripple absolute inset-0 rounded-full bg-white/25" />
        <span className="seek-feedback-ring absolute inset-0 rounded-full border-2 border-white/40" />
        <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-black/50 text-white shadow-lg shadow-black/40 sm:h-[76px] sm:w-[76px]">
          <SeekDirectionIcon direction={direction} seconds={seconds} className="h-12 w-12 sm:h-[52px] sm:w-[52px]" />
        </div>
      </div>
    </div>
  );
}
