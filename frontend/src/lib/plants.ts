import type { PlantCategory, UserPlantStatus } from '@/types/plants';
import { USER_PLANT_STATUSES } from '@/types/plants';
import tomatoImg from '@/assets/garden_icons/tomato.png';
import squashImg from '@/assets/garden_icons/squash.png';

// Ideogram prompt: "Flat design icon of a [veggie], similar to an emoji, transparent background, consistent vegetable illustration style, no text"
// Plants that share an emoji and need a custom image:
//   Vegetables: Cucumber & Zucchini (🥒), Pumpkin (🎃 same as Squash), Lettuce & Spinach & Kale (🥬),
//               Carrot & Radish (🥕), Potato & Rutabaga (🥔), Broccoli & Cauliflower (🥦)
//   Fruits:     Raspberry & Blueberry (🫐)
//   Flowers:    Nasturtium & Zinnia (🌸)
//   Herbs:      all share 🌿 — Basil, Parsley, Cilantro, Chives, Dill, Mint, Rosemary, Thyme, Oregano, Sage
const PLANT_IMAGES: Record<string, string> = {
  'Tomato': tomatoImg,
  'Squash': squashImg,
};

export function plantImage(name: string): string | null {
  return PLANT_IMAGES[name] ?? null;
}

const PLANT_EMOJIS: Record<string, string> = {
  'Tomato': '🍅',
  'Cucumber': '🥒',
  'Zucchini': '🥒',
  'Squash': '🎃',
  'Pumpkin': '🎃',
  'Bell Pepper': '🫑',
  'Jalapeño': '🌶️',
  'Lettuce': '🥬',
  'Spinach': '🥬',
  'Kale': '🥬',
  'Carrot': '🥕',
  'Radish': '🥕',
  'Rutabaga': '🥔',
  'Green Bean': '🫘',
  'Pea': '🫛',
  'Broccoli': '🥦',
  'Cauliflower': '🥦',
  'Garlic': '🧄',
  'Onion': '🧅',
  'Sweet Corn': '🌽',
  'Potato': '🥔',
  'Strawberry': '🍓',
  'Raspberry': '🫐',
  'Blueberry': '🫐',
  'Watermelon': '🍉',
  'Cantaloupe': '🍈',
  'Sunflower': '🌻',
  'Marigold': '🌼',
  'Nasturtium': '🌸',
  'Zinnia': '🌸',
  'Lavender': '💜',
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

export const STATUS_CLASSES: Record<UserPlantStatus, string> = {
  planned: 'bg-muted text-muted-foreground',
  planted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  growing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  fruiting: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  dormant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  removed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function statusLabel(status: UserPlantStatus): string {
  return USER_PLANT_STATUSES.find((s) => s.value === status)?.label ?? status;
}
