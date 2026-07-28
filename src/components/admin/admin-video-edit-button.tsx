'use client';

import { useState } from 'react';
import type { Video } from '@/lib/api/types';
import { VideoEditModal } from '@/components/admin/video-edit-modal';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { Pencil } from 'lucide-react';

interface AdminVideoEditButtonProps {
  video: Video;
  className?: string;
  onUpdated?: (video: Video) => void;
}

export function AdminVideoEditButton({
  video,
  className,
  onUpdated,
}: AdminVideoEditButtonProps) {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={
          className ??
          'inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-red-500/50 hover:text-white'
        }
        aria-label={`Edit ${video.title}`}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>

      {open && (
        <VideoEditModal
          video={video}
          onClose={() => setOpen(false)}
          onSaved={(updated) => {
            onUpdated?.(updated);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
