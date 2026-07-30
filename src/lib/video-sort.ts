export interface VideoSortOption {
  value: string;
  label: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export const VIDEO_SORT_OPTIONS: VideoSortOption[] = [
  { value: 'newest', label: 'Newest first', sortBy: 'createdAt', sortOrder: 'DESC' },
  { value: 'oldest', label: 'Oldest first', sortBy: 'createdAt', sortOrder: 'ASC' },
  { value: 'views-desc', label: 'Most viewed', sortBy: 'views', sortOrder: 'DESC' },
  { value: 'views-asc', label: 'Least viewed', sortBy: 'views', sortOrder: 'ASC' },
  { value: 'title-asc', label: 'Title A–Z', sortBy: 'title', sortOrder: 'ASC' },
  { value: 'title-desc', label: 'Title Z–A', sortBy: 'title', sortOrder: 'DESC' },
];

export const DEFAULT_VIDEO_SORT = VIDEO_SORT_OPTIONS[0];

export function parseVideoSort(value: string | null | undefined): VideoSortOption {
  return VIDEO_SORT_OPTIONS.find((option) => option.value === value) ?? DEFAULT_VIDEO_SORT;
}
