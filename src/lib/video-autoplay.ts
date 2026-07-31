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

/** iOS Safari blocks unmuted autoplay — start muted, then unmute after playback begins. */
export function needsMutedAutoplayKickstart(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return isIOS;
}
