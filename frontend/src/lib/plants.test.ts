import type { UserPlantStatus } from '@/types/plants';
import { statusLabel, plantEmoji } from './plants';

describe('statusLabel', () => {
  it('returns the display label for a known status', () => {
    expect(statusLabel('growing')).toBe('Growing');
    expect(statusLabel('planned')).toBe('Planned');
  });

  it('returns the raw status string for an unknown status', () => {
    expect(statusLabel('unknown_status' as UserPlantStatus)).toBe('unknown_status');
  });
});

describe('plantEmoji', () => {
  it('returns the specific emoji for a known plant name', () => {
    expect(plantEmoji('Tomato', 'vegetable')).toBe('🍅');
    expect(plantEmoji('Garlic', 'vegetable')).toBe('🧄');
    expect(plantEmoji('Sunflower', 'flower')).toBe('🌻');
  });

  it('falls back to the category emoji for an unknown plant name', () => {
    expect(plantEmoji('Unknown Veggie', 'vegetable')).toBe('🥦');
    expect(plantEmoji('Unknown Herb', 'herb')).toBe('🌿');
    expect(plantEmoji('Unknown Flower', 'flower')).toBe('🌸');
  });

  it('falls back to the generic emoji for an unknown category', () => {
    expect(plantEmoji('Unknown Plant', 'other')).toBe('🌱');
  });
});
