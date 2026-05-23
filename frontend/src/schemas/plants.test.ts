import { userPlantSchema, observationSchema } from './plants';

describe('userPlantSchema', () => {
  const valid = {
    gardenId: 'garden-1',
    bedId: 'bed-1',
    plant: 'catalog-1',
    status: 'growing' as const,
  };

  it('accepts valid plant data', () => {
    expect(userPlantSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing gardenId', () => {
    expect(userPlantSchema.safeParse({ ...valid, gardenId: '' }).success).toBe(false);
  });

  it('rejects missing bedId', () => {
    expect(userPlantSchema.safeParse({ ...valid, bedId: '' }).success).toBe(false);
  });

  it('rejects missing plant', () => {
    expect(userPlantSchema.safeParse({ ...valid, plant: '' }).success).toBe(false);
  });

  it('rejects invalid status', () => {
    expect(userPlantSchema.safeParse({ ...valid, status: 'wilting' }).success).toBe(false);
  });

  it('accepts optional fields when absent', () => {
    expect(userPlantSchema.safeParse(valid).success).toBe(true);
  });
});

describe('observationSchema', () => {
  it('accepts a status_change observation with a newStatus', () => {
    expect(observationSchema.safeParse({
      type: 'status_change',
      observedDate: '2024-06-01',
      newStatus: 'growing',
      note: '',
    }).success).toBe(true);
  });

  it('rejects a status_change observation with no newStatus', () => {
    const result = observationSchema.safeParse({
      type: 'status_change',
      observedDate: '2024-06-01',
      newStatus: '',
      note: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.newStatus).toBeDefined();
    }
  });

  it('accepts a non-status_change observation with a note', () => {
    expect(observationSchema.safeParse({
      type: 'general',
      observedDate: '2024-06-01',
      newStatus: 'growing',
      note: 'Looking healthy',
    }).success).toBe(true);
  });

  it('rejects a non-status_change observation with no note', () => {
    const result = observationSchema.safeParse({
      type: 'general',
      observedDate: '2024-06-01',
      newStatus: 'growing',
      note: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.note).toBeDefined();
    }
  });

  it('rejects missing observedDate', () => {
    expect(observationSchema.safeParse({
      type: 'general',
      observedDate: '',
      newStatus: 'growing',
      note: 'test',
    }).success).toBe(false);
  });
});
