// To add a new image: drop a PNG named <object-type>.png into src/assets/garden_objects/
// Ideogram prompt: "Glossy cartoon vector icon of a [object], Apple emoji style, slightly elevated three-quarter front view,
// smooth gradient shading with specular highlights, vibrant saturated colors, transparent background, no text, no shadows"
// Circle objects (fountain, bird bath, pot) use: "top-down slightly elevated overhead view" instead
import type { FeatureObjectType, FeatureShape } from '@/types/gardens';

const featureImageModules = import.meta.glob('@/assets/garden_objects/*.png', {
  eager: true,
  import: 'default',
});

export function featureImage(objectType: FeatureObjectType): string | null {
  const key = `/src/assets/garden_objects/${objectType}.png`;
  return (featureImageModules[key] as string) ?? null;
}

type FeatureConfig = {
  value: FeatureObjectType;
  label: string;
  shape: FeatureShape;
  emoji: string;
  applicableTo: 'garden' | 'bed' | 'both';
};

export const FEATURE_OBJECT_TYPES: FeatureConfig[] = [
  { value: 'shed',         label: 'Shed',                    shape: 'rect',   emoji: '🏚️',  applicableTo: 'garden' },
  { value: 'bench',        label: 'Bench',                   shape: 'rect',   emoji: '🪑',  applicableTo: 'garden' },
  { value: 'arbor',        label: 'Arbor / Arch',            shape: 'rect',   emoji: '🌿',  applicableTo: 'garden' },
  { value: 'trellis',      label: 'Trellis',                 shape: 'rect',   emoji: '🪟',  applicableTo: 'both'   },
  { value: 'fence',        label: 'Fence',                   shape: 'rect',   emoji: '🚧',  applicableTo: 'garden' },
  { value: 'compost',      label: 'Compost Bin',             shape: 'rect',   emoji: '♻️',  applicableTo: 'garden' },
  { value: 'rain_barrel',  label: 'Rain Barrel',             shape: 'rect',   emoji: '🪣',  applicableTo: 'garden' },
  { value: 'cold_frame',   label: 'Cold Frame',              shape: 'rect',   emoji: '🌡️',  applicableTo: 'both'   },
  { value: 'fountain',     label: 'Fountain',                shape: 'circle', emoji: '⛲',  applicableTo: 'garden' },
  { value: 'bird_bath',    label: 'Bird Bath',               shape: 'circle', emoji: '🐦',  applicableTo: 'garden' },
  { value: 'pot',          label: 'Pot',                     shape: 'circle', emoji: '🪴',  applicableTo: 'both'   },
  { value: 'tomato_cage',  label: 'Tomato Cage',             shape: 'circle', emoji: '🥅',  applicableTo: 'bed'    },
  { value: 'row_cover',    label: 'Row Cover / Cloche',      shape: 'circle', emoji: '🫧',  applicableTo: 'bed'    },
  { value: 'custom_rect',  label: 'Custom Area (Rectangle)', shape: 'rect',   emoji: '⬜',  applicableTo: 'both'   },
  { value: 'custom_circle',label: 'Custom Area (Circle)',    shape: 'circle', emoji: '⭕',  applicableTo: 'both'   },
];

const FEATURE_EMOJI_MAP = Object.fromEntries(
  FEATURE_OBJECT_TYPES.map((f) => [f.value, f.emoji]),
) as Record<FeatureObjectType, string>;

export function featureEmoji(objectType: FeatureObjectType): string {
  return FEATURE_EMOJI_MAP[objectType] ?? '📦';
}

export function featureLabel(objectType: FeatureObjectType): string {
  return FEATURE_OBJECT_TYPES.find((f) => f.value === objectType)?.label ?? objectType;
}

export function featureShape(objectType: FeatureObjectType): FeatureShape {
  return FEATURE_OBJECT_TYPES.find((f) => f.value === objectType)?.shape ?? 'rect';
}

export const CUSTOM_FEATURE_TYPES: FeatureObjectType[] = ['custom_rect', 'custom_circle'];

export function isCustomFeature(objectType: FeatureObjectType): boolean {
  return CUSTOM_FEATURE_TYPES.includes(objectType);
}
