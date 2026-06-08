import { featureEmoji, featureLabel, featureShape, isCustomFeature } from './features';

describe('featureEmoji', () => {
  it('returns the emoji for a known object type', () => {
    expect(featureEmoji('bench')).toBe('🪑');
    expect(featureEmoji('shed')).toBe('🏚️');
    expect(featureEmoji('fountain')).toBe('⛲');
  });

  it('falls back to 📦 for an unknown type', () => {
    expect(featureEmoji('unknown' as never)).toBe('📦');
  });
});

describe('featureLabel', () => {
  it('returns the display label for a known object type', () => {
    expect(featureLabel('bench')).toBe('Bench');
    expect(featureLabel('rain_barrel')).toBe('Rain Barrel');
    expect(featureLabel('custom_rect')).toBe('Custom Area (Rectangle)');
  });

  it('falls back to the raw type string for an unknown type', () => {
    expect(featureLabel('unknown' as never)).toBe('unknown');
  });
});

describe('featureShape', () => {
  it('returns rect for rect-shaped objects', () => {
    expect(featureShape('shed')).toBe('rect');
    expect(featureShape('trellis')).toBe('rect');
  });

  it('returns circle for circle-shaped objects', () => {
    expect(featureShape('fountain')).toBe('circle');
    expect(featureShape('pot')).toBe('circle');
  });

  it('falls back to rect for an unknown type', () => {
    expect(featureShape('unknown' as never)).toBe('rect');
  });
});

describe('isCustomFeature', () => {
  it('returns true for custom_rect and custom_circle', () => {
    expect(isCustomFeature('custom_rect')).toBe(true);
    expect(isCustomFeature('custom_circle')).toBe(true);
  });

  it('returns false for standard types', () => {
    expect(isCustomFeature('shed')).toBe(false);
    expect(isCustomFeature('bench')).toBe(false);
    expect(isCustomFeature('fountain')).toBe(false);
  });
});
