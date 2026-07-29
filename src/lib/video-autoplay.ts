/** Slug of the video the user tapped — consumed when the watch player starts playback. */
let pendingAutoplaySlug: string | null = null;

export function markVideoAutoplayIntent(slug: string): void {
  pendingAutoplaySlug = slug;
}

export function takeVideoAutoplayIntent(slug: string): boolean {
  if (pendingAutoplaySlug !== slug) return false;
  pendingAutoplaySlug = null;
  return true;
}
