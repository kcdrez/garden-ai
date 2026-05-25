import { gardenSchema } from './gardens';

const valid = { name: 'Front Yard', description: '', length: '10', width: '8', unit: 'ft' as const };

describe('gardenSchema', () => {
  it('accepts valid garden data', () => {
    expect(gardenSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(gardenSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('accepts empty length and width (dimensions are optional)', () => {
    expect(gardenSchema.safeParse({ ...valid, length: '', width: '' }).success).toBe(true);
  });

  it('rejects non-positive length', () => {
    expect(gardenSchema.safeParse({ ...valid, length: '0' }).success).toBe(false);
  });

  it('rejects invalid unit', () => {
    expect(gardenSchema.safeParse({ ...valid, unit: 'miles' }).success).toBe(false);
  });
});
