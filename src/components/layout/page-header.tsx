import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCENT_STYLES = {
  red: 'bg-red-500/15 text-red-400 ring-red-500/20',
  orange: 'bg-orange-500/15 text-orange-400 ring-orange-500/20',
  blue: 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
  violet: 'bg-violet-500/15 text-violet-400 ring-violet-500/20',
  emerald: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
  zinc: 'bg-zinc-800/80 text-zinc-300 ring-zinc-700',
} as const;

export type PageHeaderAccent = keyof typeof ACCENT_STYLES;

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: PageHeaderAccent;
  className?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  accent = 'red',
  className,
  action,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-3 sm:mb-6', className)}>
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 sm:h-11 sm:w-11',
            ACCENT_STYLES[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

interface QuickNavChipProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}

export function QuickNavChip({ href, label, icon: Icon, active }: QuickNavChipProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition active:scale-[0.98] sm:text-sm',
        active
          ? 'border-red-500/40 bg-red-500/15 text-red-300'
          : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900',
      )}
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      {label}
    </Link>
  );
}

export function QuickNavRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0',
        className,
      )}
    >
      {children}
    </div>
  );
}
