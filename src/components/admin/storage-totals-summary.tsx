import type { B2StorageKey, StorageTotalsSummary } from '@/lib/api/types';
import { cn, formatBytes } from '@/lib/utils';

export function sumStorageKeys(keys: B2StorageKey[]): StorageTotalsSummary {
  const usedBytes = keys.reduce((sum, key) => sum + key.usageBytes, 0);
  const quotaBytes = keys.reduce((sum, key) => sum + key.quotaBytes, 0);
  const freeBytes = Math.max(0, quotaBytes - usedBytes);
  const usagePercent = quotaBytes > 0 ? Math.round((usedBytes / quotaBytes) * 1000) / 10 : 0;

  return {
    keyCount: keys.length,
    activeKeyCount: keys.filter((key) => key.isActive).length,
    usedBytes,
    quotaBytes,
    freeBytes,
    usagePercent,
  };
}

interface StorageTotalsSummaryCardProps {
  storage: StorageTotalsSummary;
  className?: string;
}

export function StorageTotalsSummaryCard({ storage, className }: StorageTotalsSummaryCardProps) {
  const barPercent = Math.min(100, storage.usagePercent);

  return (
    <div className={cn('rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white">Total storage across all keys</p>
          <p className="mt-1 text-xs text-zinc-500">
            {storage.keyCount} key{storage.keyCount === 1 ? '' : 's'}
            {storage.activeKeyCount !== storage.keyCount
              ? ` · ${storage.activeKeyCount} active`
              : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-white sm:text-xl">
            {formatBytes(storage.usedBytes)}{' '}
            <span className="text-sm font-normal text-zinc-500">used</span>
          </p>
          <p className="mt-0.5 text-sm text-zinc-400">
            {formatBytes(storage.freeBytes)} free of {formatBytes(storage.quotaBytes)}
          </p>
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            storage.usagePercent >= 95
              ? 'bg-amber-500'
              : storage.usagePercent >= 80
                ? 'bg-yellow-500'
                : 'bg-red-500',
          )}
          style={{ width: `${barPercent}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>{storage.usagePercent.toFixed(1)}% used</span>
        <span>{formatBytes(storage.quotaBytes)} total capacity</span>
      </div>
    </div>
  );
}
