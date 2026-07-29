const VIDEO_OBJECT_KEY = /^videos\/([0-9a-f-]{36})\//i;

export function parseVideoUuidFromObjectKey(objectKey: string): string | null {
  const match = objectKey.match(VIDEO_OBJECT_KEY);
  return match?.[1] ?? null;
}

export function videoStoragePrefix(uuid: string): string {
  return `videos/${uuid}/`;
}

export function keysForSameVideoPrefix(objectKey: string): (key: string) => boolean {
  const uuid = parseVideoUuidFromObjectKey(objectKey);
  if (!uuid) {
    return (key) => key === objectKey;
  }
  const prefix = videoStoragePrefix(uuid);
  return (key) => key.startsWith(prefix);
}
