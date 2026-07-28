import type { Video } from '@/lib/api/types';
import Link from 'next/link';

interface VideoMetadataPanelProps {
  video: Video;
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-zinc-200">{value}</dd>
    </div>
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

  return (
    <div className="space-y-4">
      {video.summary && (
        <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">{video.summary}</p>
      )}

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {video.category?.name && (
          <MetadataItem label="Category" value={video.category.name} />
        )}
        {video.subCategory && <MetadataItem label="Creator / Series" value={video.subCategory} />}
        {video.contentType && <MetadataItem label="Type" value={video.contentType} />}
        {video.language && video.language !== 'Unknown' && (
          <MetadataItem label="Language" value={video.language} />
        )}
        {video.ageRating && <MetadataItem label="Age rating" value={video.ageRating} />}
      </dl>

      {video.description && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Description
          </h2>
          <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-zinc-300 sm:text-base">
            {video.description}
          </p>
        </div>
      )}

      {video.keywords && video.keywords.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Keywords
          </h2>
          <div className="flex flex-wrap gap-2">
            {video.keywords.map((keyword) => (
              <Link
                key={keyword}
                href={`/search?q=${encodeURIComponent(keyword)}`}
                className="rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-red-500/50 hover:text-white"
              >
                {keyword}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
