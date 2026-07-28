'use client';

import { FormEvent, useState } from 'react';
import type { Video } from '@/lib/api/types';
import { useCategories } from '@/hooks/use-categories';
import { useRegenerateVideoMetadata, useUpdateVideo } from '@/hooks/use-admin';

interface VideoEditModalProps {
  video: Video;
  onClose: () => void;
  onSaved?: (video: Video) => void;
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function VideoEditModal({ video, onClose, onSaved }: VideoEditModalProps) {
  const { data: categories } = useCategories();
  const updateVideo = useUpdateVideo();
  const regenerateMetadata = useRegenerateVideoMetadata();

  const [title, setTitle] = useState(video.title);
  const [slug, setSlug] = useState(video.slug);
  const [description, setDescription] = useState(video.description ?? '');
  const [summary, setSummary] = useState(video.summary ?? '');
  const [subCategory, setSubCategory] = useState(video.subCategory ?? '');
  const [contentType, setContentType] = useState(video.contentType ?? '');
  const [language, setLanguage] = useState(video.language ?? '');
  const [ageRating, setAgeRating] = useState(video.ageRating ?? '');
  const [visibility, setVisibility] = useState(video.visibility);
  const [categoryId, setCategoryId] = useState(video.categoryId ?? video.category?.id ?? '');
  const [keywords, setKeywords] = useState((video.keywords ?? []).join(', '));
  const [tags, setTags] = useState(
    (video.videoTags ?? []).map((item) => item.tag.name).join(', '),
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const updated = await updateVideo.mutateAsync({
        id: video.id,
        input: {
          title: title.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          summary: summary.trim(),
          subCategory: subCategory.trim(),
          contentType: contentType.trim(),
          language: language.trim(),
          ageRating: ageRating.trim(),
          visibility,
          categoryId: categoryId || undefined,
          keywords: splitList(keywords),
          tags: splitList(tags),
        },
      });
      onSaved?.(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update video');
    }
  };

  const handleRegenerate = async () => {
    setError(null);
    setMessage(null);
    try {
      const generated = await regenerateMetadata.mutateAsync(video.id);
      if (generated) {
        setTitle(generated.title);
        setSlug(generated.slug);
        setDescription(generated.description ?? '');
        setSummary(generated.summary ?? '');
        setSubCategory(generated.subCategory ?? '');
        setContentType(generated.contentType ?? '');
        setLanguage(generated.language ?? '');
        setAgeRating(generated.ageRating ?? '');
        setKeywords((generated.keywords ?? []).join(', '));
        setTags((generated.tags ?? []).join(', '));
        setMessage('AI metadata regenerated. Review and save if needed.');
      } else {
        setMessage('Metadata regeneration completed with no changes.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate metadata');
    }
  };

  const saving = updateVideo.isPending;
  const regenerating = regenerateMetadata.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit video metadata</h2>
            <p className="mt-1 text-sm text-zinc-400">Update title, description, and taxonomy fields.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 rounded-lg border border-green-900 bg-green-950/40 px-3 py-2 text-sm text-green-300">
            {message}
          </p>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Slug (URL)</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Summary</span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">Creator / Subcategory</span>
              <input
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">Category</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              >
                <option value="">Uncategorized</option>
                {(categories ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">Content type</span>
              <input
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                placeholder="Lecture, Episode, Tutorial..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">Language</span>
              <input
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">Age rating</span>
              <input
                value={ageRating}
                onChange={(e) => setAgeRating(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">Visibility</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Keywords (comma-separated)</span>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Tags to add (comma-separated)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void handleRegenerate()}
            disabled={regenerating || saving}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-50"
          >
            {regenerating ? 'Regenerating...' : 'Regenerate with AI'}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || regenerating}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
