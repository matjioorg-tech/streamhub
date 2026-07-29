import type { VideoQualityOption } from '@/lib/api/types';

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/** Pick a sensible default for "Auto" — prefer 720p on mobile, 1080p on desktop when multiple renditions exist. */
export function pickAutoQualityOption(options: VideoQualityOption[]): VideoQualityOption | null {
  if (options.length === 0) return null;
  if (options.length === 1) return options[0];

  const cap = isMobileDevice() ? 720 : 1080;
  const sortedDesc = [...options].sort((a, b) => b.height - a.height);
  const withinCap = sortedDesc.find((q) => q.height > 0 && q.height <= cap);
  if (withinCap) return withinCap;

  const sortedAsc = [...options].sort((a, b) => a.height - b.height);
  return sortedAsc[0];
}
