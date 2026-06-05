import type { PlantCategory, UserPlantStatus } from '@/types/plants';
import { USER_PLANT_STATUSES } from '@/types/plants';
// Ideogram prompt: "Flat design icon of a [veggie], similar to an emoji, transparent background, consistent vegetable illustration style, no text"
// To add a new image: drop a PNG named <plant-name-lowercase>.png into src/assets/garden_icons/
// Missing images (falls back to emoji):
// None
const plantImageModules = import.meta.glob('@/assets/garden_icons/*.png', {
  eager: true,
  import: 'default',
});

export function plantImage(name: string): string | null {
  const key = `/src/assets/garden_icons/${name.toLowerCase()}.png`;
  return (plantImageModules[key] as string) ?? null;
}

const PLANT_EMOJIS: Record<string, string> = {
  Tomato: '🍅',
  Cucumber: '🥒',
  Zucchini: '🥒',
  Squash: '🎃',
  Pumpkin: '🎃',
  'Bell Pepper': '🫑',
  Jalapeño: '🌶️',
  Lettuce: '🥬',
  Spinach: '🥬',
  Kale: '🥬',
  Carrot: '🥕',
  Radish: '🥕',
  Rutabaga: '🥔',
  'Green Bean': '🫘',
  Pea: '🫛',
  Broccoli: '🥦',
  Cauliflower: '🥦',
  Garlic: '🧄',
  Onion: '🧅',
  'Sweet Corn': '🌽',
  Potato: '🥔',
  Blackberry: '🫐',
  Strawberry: '🍓',
  Raspberry: '🫐',
  Blueberry: '🫐',
  Watermelon: '🍉',
  Cantaloupe: '🍈',
  Eggplant: '🍆',
  'Sweet Potato': '🍠',
  Cabbage: '🥬',
  'Swiss Chard': '🥬',
  Arugula: '🥬',
  Calendula: '🌼',
  Echinacea: '🌺',
  Sunflower: '🌻',
  Marigold: '🌼',
  Nasturtium: '🌸',
  Zinnia: '🌸',
  Lavender: '💜',
};

const CATEGORY_EMOJIS: Record<PlantCategory, string> = {
  vegetable: '🥦',
  herb: '🌿',
  fruit: '🍓',
  flower: '🌸',
  other: '🌱',
};

export function plantEmoji(name: string, category: PlantCategory): string {
  return PLANT_EMOJIS[name] ?? CATEGORY_EMOJIS[category] ?? '🌱';
}

const STATUS_COLOR_CONFIG: Record<UserPlantStatus, { pill: string; bar: string }> = {
  planned:  { pill: 'bg-muted text-muted-foreground',                                          bar: 'bg-slate-300 dark:bg-slate-400' },
  planted:  { pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',        bar: 'bg-blue-300' },
  growing:  { pill: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',    bar: 'bg-green-300' },
  fruiting: { pill: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', bar: 'bg-purple-300' },
  dormant:  { pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',    bar: 'bg-amber-300' },
  removed:  { pill: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',            bar: 'bg-red-300' },
};

export const STATUS_CLASSES: Record<UserPlantStatus, string> = Object.fromEntries(
  Object.entries(STATUS_COLOR_CONFIG).map(([k, v]) => [k, v.pill]),
) as Record<UserPlantStatus, string>;

export const STATUS_BAR_CLASSES: Record<UserPlantStatus, string> = Object.fromEntries(
  Object.entries(STATUS_COLOR_CONFIG).map(([k, v]) => [k, v.bar]),
) as Record<UserPlantStatus, string>;

export function statusLabel(status: UserPlantStatus): string {
  return USER_PLANT_STATUSES.find((s) => s.value === status)?.label ?? status;
}

// Anchored here so Tailwind scans these classes from a well-known file.
// Used in PlantingGantt event dots.
export const CALENDAR_EVENT_DOT_CLASSES = {
  weather: 'bg-cyan-400',
  general: 'bg-violet-400',
} as const;
