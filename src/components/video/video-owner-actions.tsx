'use client';

import { useState } from 'react';
import { Pencil, Trash2, MoreVertical } from 'lucide-react';
import type { Video } from '@/lib/api/types';
import { VideoEditModal } from '@/components/admin/video-edit-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useIsVideoOwner } from '@/hooks/use-is-video-owner';
import { useDeleteMyVideo } from '@/hooks/use-my-videos';
import { cn } from '@/lib/utils';

interface VideoOwnerActionsProps {
  video: Video;
  className?: string;
  compact?: boolean;
  onUpdated?: (video: Video) => void;
  onDeleted?: () => void;
}

export function VideoOwnerActions({
  video,
  className,
  compact = false,
  onUpdated,
  onDeleted,
}: VideoOwnerActionsProps) {
  const isOwner = useIsVideoOwner(video);
  const deleteVideo = useDeleteMyVideo();
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!isOwner) {
    return null;
  }

  const handleDelete = async () => {
    try {
      await deleteVideo.mutateAsync(video.id);
      setDeleteOpen(false);
      onDeleted?.();
    } catch {
      // mutation error surfaced by parent if needed
    }
  };

  if (compact) {
    return (
      <>
        <div className={cn('relative', className)}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-zinc-700/80 bg-black/75 text-white backdrop-blur-sm hover:border-red-500/50"
            aria-label="Video options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              />
              <div className="absolute right-0 top-full z-30 mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 py-1 shadow-xl">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    setEditOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {editOpen && (
          <VideoEditModal
            video={video}
            variant="user"
            onClose={() => setEditOpen(false)}
            onSaved={(updated) => {
              onUpdated?.(updated);
              setEditOpen(false);
            }}
          />
        )}

        {deleteOpen && (
          <ConfirmDialog
            title="Delete video?"
            description={`Delete "${video.title}"? This cannot be undone.`}
            confirmLabel="Delete"
            loading={deleteVideo.isPending}
            onCancel={() => setDeleteOpen(false)}
            onConfirm={() => void handleDelete()}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={cn('flex flex-wrap gap-2', className)}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditOpen(true);
          }}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-red-500/50 hover:text-white"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDeleteOpen(true);
          }}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-red-300 hover:border-red-500/50 hover:bg-red-950/30"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {editOpen && (
        <VideoEditModal
          video={video}
          variant="user"
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            onUpdated?.(updated);
            setEditOpen(false);
          }}
        />
      )}

      {deleteOpen && (
        <ConfirmDialog
          title="Delete video?"
          description={`Delete "${video.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          loading={deleteVideo.isPending}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </>
  );
}
