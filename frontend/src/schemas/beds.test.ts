import { bedSchema, quickBedSchema } from './beds';

const validBed = {
  gardenId: 'garden-1',
  name: 'Raised Bed',
  length: '4',
  width: '4',
  depth: '',
  unit: 'ft' as const,
  facing: undefined,
  avgSunlightHours: '',
  soilType: '',
  notes: '',
};

describe('bedSchema', () => {
  it('accepts valid bed data', () => {
    expect(bedSchema.safeParse(validBed).success).toBe(true);
  });

  it('rejects missing gardenId', () => {
    expect(bedSchema.safeParse({ ...validBed, gardenId: '' }).success).toBe(false);
  });

  it('rejects missing name', () => {
    expect(bedSchema.safeParse({ ...validBed, name: '' }).success).toBe(false);
  });

  it('rejects zero or negative length', () => {
    expect(bedSchema.safeParse({ ...validBed, length: '0' }).success).toBe(false);
  });

  it('accepts empty depth (optional)', () => {
    expect(bedSchema.safeParse({ ...validBed, depth: '' }).success).toBe(true);
  });

  it('accepts valid sunlight hours', () => {
    expect(bedSchema.safeParse({ ...validBed, avgSunlightHours: '6' }).success).toBe(true);
  });

  it('accepts sunlight hours at the maximum (24)', () => {
    expect(bedSchema.safeParse({ ...validBed, avgSunlightHours: '24' }).success).toBe(true);
  });

  it('rejects sunlight hours above 24', () => {
    expect(bedSchema.safeParse({ ...validBed, avgSunlightHours: '25' }).success).toBe(false);
  });

  it('accepts empty sunlight hours', () => {
    expect(bedSchema.safeParse({ ...validBed, avgSunlightHours: '' }).success).toBe(true);
  });

  it('rejects invalid unit', () => {
    expect(bedSchema.safeParse({ ...validBed, unit: 'miles' }).success).toBe(false);
  });
});

describe('quickBedSchema', () => {
  const validQuick = { gardenId: 'garden-1', name: 'Raised Bed', length: '4', width: '4', unit: 'ft' as const };

  it('accepts valid quick bed data', () => {
    expect(quickBedSchema.safeParse(validQuick).success).toBe(true);
  });

  it('rejects missing name', () => {
    expect(quickBedSchema.safeParse({ ...validQuick, name: '' }).success).toBe(false);
  });
});
