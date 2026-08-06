export const SUBCATEGORY_LABELS: Record<string, string> = {
  Education: 'Creator',
  Course: 'Creator',
  'Music & Podcast': 'Creator',
  Entertainment: 'Creator',
  Lifestyle: 'Creator',
  'Movies & Series': 'Genre',
  Gaming: 'Game',
  'Business & Finance': 'Topic',
  'News & Sports': 'Topic',
  Kids: 'Topic',
};

export function getSubCategoryLabel(categoryName: string | null | undefined): string {
  if (!categoryName) return 'Creator';
  return SUBCATEGORY_LABELS[categoryName] ?? 'Topic';
}

export const CATEGORY_ACCENTS: Record<string, string> = {
  Education: 'from-blue-600/20 to-indigo-600/10',
  Course: 'from-violet-600/20 to-purple-600/10',
  'Movies & Series': 'from-rose-600/20 to-pink-600/10',
  Gaming: 'from-emerald-600/20 to-green-600/10',
  'Music & Podcast': 'from-amber-600/20 to-orange-600/10',
  'Business & Finance': 'from-cyan-600/20 to-teal-600/10',
  'News & Sports': 'from-sky-600/20 to-blue-600/10',
  Lifestyle: 'from-fuchsia-600/20 to-pink-600/10',
  Entertainment: 'from-red-600/20 to-orange-600/10',
  Kids: 'from-lime-600/20 to-yellow-600/10',
};

export const CATEGORY_ICONS: Record<string, string> = {
  Education: '📚',
  Course: '💻',
  'Movies & Series': '🎬',
  Gaming: '🎮',
  'Music & Podcast': '🎧',
  'Business & Finance': '💼',
  'News & Sports': '📰',
  Lifestyle: '✨',
  Entertainment: '🎭',
  Kids: '🧸',
};

export function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? '📁';
}
