import type { PlantCategory, UserPlantStatus } from '@/types/plants';
import { USER_PLANT_STATUSES } from '@/types/plants';
// Ideogram prompt: "Flat design icon of a [veggie], similar to an emoji, transparent background, consistent vegetable illustration style, no text"
// To add a new image: drop a PNG named <plant-name-lowercase>.png into src/assets/garden_icons/
// Missing images (falls back to emoji):
//   Vegetables: arugula, asparagus, beet, bell pepper, broccoli, cabbage, carrot, cucumber, eggplant, garlic, green bean, jalapeño, leek, onion, pea, potato, pumpkin, rutabaga, sweet corn, sweet potato, swiss chard
//   Fruits:     blackberry, blueberry, cantaloupe, strawberry, watermelon
//   Flowers:    calendula, echinacea, lavender, marigold, nasturtium, sunflower, zinnia
//   Herbs:      dill, fennel, lemon balm, mint, oregano, rosemary, sage, thyme
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

export const STATUS_CLASSES: Record<UserPlantStatus, string> = {
  planned: 'bg-muted text-muted-foreground',
  planted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  growing:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  fruiting:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  dormant:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  removed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function statusLabel(status: UserPlantStatus): string {
  return USER_PLANT_STATUSES.find((s) => s.value === status)?.label ?? status;
}
