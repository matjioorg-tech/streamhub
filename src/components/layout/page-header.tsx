import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCENT_STYLES = {
  red: 'from-rose-500/20 to-red-600/5 text-rose-400',
  orange: 'from-orange-500/20 to-orange-600/5 text-orange-400',
  blue: 'from-blue-500/20 to-blue-600/5 text-blue-400',
  violet: 'from-violet-500/20 to-violet-600/5 text-violet-400',
  emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400',
  zinc: 'from-neutral-500/20 to-neutral-600/5 text-neutral-300',
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
    <div className={cn('mb-6 flex items-start justify-between gap-4 sm:mb-8', className)}>
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-yt-border/80',
            ACCENT_STYLES[accent],
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 pt-0.5">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
            {title}
          </h1>
          {subtitle && <p className="pro-section-subtitle mt-1">{subtitle}</p>}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

interface QuickNavChipProps {
  href: string;
  label: string;
  icon?: LucideIcon;
  active?: boolean;
}

export function QuickNavChip({ href, label, icon: Icon, active }: QuickNavChipProps) {
  return (
    <Link
      href={href}
      className={cn('pro-chip', active ? 'pro-chip-active' : 'pro-chip-inactive')}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </Link>
  );
}

export function QuickNavRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
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
