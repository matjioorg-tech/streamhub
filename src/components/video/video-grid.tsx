import type { Video } from '@/lib/api/types';
import { VideoCard } from './video-card';

interface VideoGridProps {
  videos: Video[];
  title?: string;
  adminEditable?: boolean;
  onVideoUpdated?: (video: Video) => void;
}

export function VideoGrid({ videos, title, adminEditable = false, onVideoUpdated }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center text-zinc-500">
        No videos found.
      </div>
    );
  }

  return (
    <section>
      {title && (
        <h2 className="mb-4 text-lg font-semibold text-white sm:mb-5 sm:text-xl">{title}</h2>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            adminEditable={adminEditable}
            onVideoUpdated={onVideoUpdated}
          />
        ))}
      </div>
    </section>
  );
}
