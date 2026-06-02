import { mockBed, mockGarden } from '@/test/fixtures';
import {
  formatDimensions,
  facingLabel,
  bedGridDimensions,
  gardenGridDimensions,
  bedPlacementDimensions,
  bedHasDetails,
  groupByGarden,

  toFeet,
  fromFeet,
} from './beds';

describe('formatDimensions', () => {
  it('formats length × width for a bed without depth', () => {
    expect(formatDimensions(mockBed)).toBe('4 × 4 ft');
  });

  it('includes depth when present', () => {
    const bedWithDepth = { ...mockBed, depth: 12 };
    expect(formatDimensions(bedWithDepth)).toBe('4 × 4 × 12 ft');
  });
});

describe('facingLabel', () => {
  it('returns the label for a known facing value', () => {
    expect(facingLabel('N')).toBe('North');
  });

  it('returns the raw value when the facing is not in the list', () => {
    expect(facingLabel('unknown_direction')).toBe('unknown_direction');
  });
});

describe('bedGridDimensions', () => {
  it('converts ft to grid cols/rows', () => {
    expect(bedGridDimensions(mockBed)).toEqual({ cols: 4, rows: 4 });
  });

  it('converts inches to ft and rounds up', () => {
    const inchBed = { ...mockBed, width: 18, length: 24, unit: 'in' as const };
    expect(bedGridDimensions(inchBed)).toEqual({ cols: 2, rows: 2 });
  });

  it('falls back to factor 1 for an unknown unit', () => {
    const unknownBed = { ...mockBed, unit: 'yd' as never };
    expect(bedGridDimensions(unknownBed)).toEqual({ cols: 4, rows: 4 });
  });
});

describe('gardenGridDimensions', () => {
  it('returns null when garden has no dimensions', () => {
    expect(gardenGridDimensions(mockGarden)).toBeNull();
  });

  it('converts garden dimensions to grid cols/rows', () => {
    const garden = { ...mockGarden, length: 10, width: 8 };
    expect(gardenGridDimensions(garden)).toEqual({ cols: 8, rows: 10 });
  });

  it('falls back to factor 1 for an unknown unit', () => {
    const garden = { ...mockGarden, length: 4, width: 4, unit: 'yd' as never };
    expect(gardenGridDimensions(garden)).toEqual({ cols: 4, rows: 4 });
  });
});

describe('bedPlacementDimensions', () => {
  it('returns width and height in ft', () => {
    expect(bedPlacementDimensions(mockBed)).toEqual({ width: 4, height: 4 });
  });

  it('falls back to factor 1 for an unknown unit', () => {
    const unknownBed = { ...mockBed, unit: 'yd' as never };
    expect(bedPlacementDimensions(unknownBed)).toEqual({ width: 4, height: 4 });
  });
});

describe('bedHasDetails', () => {
  it('returns false for a bed with no optional fields', () => {
    expect(bedHasDetails(mockBed)).toBe(false);
  });

  it('returns true when the bed has a facing', () => {
    expect(bedHasDetails({ ...mockBed, facing: 'N' })).toBe(true);
  });

  it('returns true when the bed has notes and includeNotes is true (default)', () => {
    expect(bedHasDetails({ ...mockBed, notes: 'Rich soil' })).toBe(true);
  });

  it('returns false when the bed has only notes and includeNotes is false', () => {
    expect(bedHasDetails({ ...mockBed, notes: 'Rich soil' }, false)).toBe(false);
  });
});


describe('toFeet', () => {
  it('ft is an identity conversion', () => {
    expect(toFeet(4, 'ft')).toBe(4);
  });

  it('converts inches to feet', () => {
    expect(toFeet(12, 'in')).toBeCloseTo(1);
  });

  it('converts cm to feet', () => {
    expect(toFeet(30.48, 'cm')).toBeCloseTo(1);
  });

  it('converts meters to feet', () => {
    expect(toFeet(1, 'm')).toBeCloseTo(3.28084);
  });

  it('falls back to factor 1 for an unknown unit', () => {
    expect(toFeet(5, 'yd' as never)).toBe(5);
  });
});

describe('fromFeet', () => {
  it('ft is an identity conversion', () => {
    expect(fromFeet(4, 'ft')).toBe(4);
  });

  it('converts feet to inches', () => {
    expect(fromFeet(1, 'in')).toBeCloseTo(12);
  });

  it('converts feet to cm', () => {
    expect(fromFeet(1, 'cm')).toBeCloseTo(30.48);
  });

  it('converts feet to meters', () => {
    expect(fromFeet(3.28084, 'm')).toBeCloseTo(1);
  });

  it('is the inverse of toFeet for all units', () => {
    for (const unit of ['ft', 'in', 'cm', 'm'] as const) {
      expect(fromFeet(toFeet(5, unit), unit)).toBeCloseTo(5);
    }
  });

  it('falls back to factor 1 for an unknown unit', () => {
    expect(fromFeet(4, 'yd' as never)).toBe(4);
  });
});

describe('groupByGarden', () => {
  it('groups beds by their garden id', () => {
    const result = groupByGarden([
      { ...mockBed, id: 'bed-1', garden: 'g-1', gardenName: 'Garden A' },
      { ...mockBed, id: 'bed-2', garden: 'g-1', gardenName: 'Garden A' },
      { ...mockBed, id: 'bed-3', garden: 'g-2', gardenName: 'Garden B' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].beds).toHaveLength(2);
    expect(result[1].beds).toHaveLength(1);
  });
});
