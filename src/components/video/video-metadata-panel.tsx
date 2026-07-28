import type { Video } from '@/lib/api/types';
import Link from 'next/link';

interface VideoMetadataPanelProps {
  video: Video;
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-300">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </span>
  );
}

export function VideoMetadataPanel({ video }: VideoMetadataPanelProps) {
  const hasDetails =
    video.summary ||
    video.description ||
    video.category?.name ||
    video.subCategory ||
    video.contentType ||
    video.language ||
    video.ageRating ||
    (video.keywords && video.keywords.length > 0);

  if (!hasDetails) {
    return null;
  }

  const metaChips: { label: string; value: string }[] = [];
  if (video.category?.name) metaChips.push({ label: 'Category', value: video.category.name });
  if (video.subCategory) metaChips.push({ label: 'Creator', value: video.subCategory });
  if (video.contentType) metaChips.push({ label: 'Type', value: video.contentType });
  if (video.language && video.language !== 'Unknown') {
    metaChips.push({ label: 'Language', value: video.language });
  }
  if (video.ageRating) metaChips.push({ label: 'Rating', value: video.ageRating });

  return (
    <div className="space-y-3">
      {video.summary && (
        <p className="text-[13px] leading-relaxed text-zinc-400 sm:text-sm">{video.summary}</p>
      )}

      {metaChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {metaChips.map((chip) => (
            <MetaChip key={chip.label} label={chip.label} value={chip.value} />
          ))}
        </div>
      )}

      {video.description && (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="mb-1.5 text-[11px] font-medium text-zinc-500">Description</p>
          <p className="break-words whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-300 sm:text-sm">
            {video.description}
          </p>
        </div>
      )}

      {video.keywords && video.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {video.keywords.map((keyword) => (
            <Link
              key={keyword}
              href={`/search?q=${encodeURIComponent(keyword)}`}
              className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-red-500/40 hover:text-zinc-200"
            >
              {keyword}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
