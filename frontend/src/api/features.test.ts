import {
  fetchGardenFeatures,
  createGardenFeature,
  updateGardenFeature,
  deleteGardenFeature,
  fetchBedFeatures,
  createBedFeature,
  updateBedFeature,
  deleteBedFeature,
} from './features';
import { api } from './client';

vi.mock('./client', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

const gardenId = 'garden-1';
const bedId = 'bed-1';
const featureId = 'feat-1';
const feature = { id: featureId, objectType: 'bench', shape: 'rect', label: 'Bench', x: 0, y: 0, width: 2, height: 1 };

describe('fetchGardenFeatures', () => {
  it('calls GET /gardens/:id/features/ and returns data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [feature] });
    const result = await fetchGardenFeatures(gardenId);
    expect(api.get).toHaveBeenCalledWith(`/gardens/${gardenId}/features/`);
    expect(result).toEqual([feature]);
  });

  it('returns an empty array when data is null', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: null });
    expect(await fetchGardenFeatures(gardenId)).toEqual([]);
  });
});

describe('createGardenFeature', () => {
  it('calls POST /gardens/:id/features/ with the payload', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: feature });
    const payload = { objectType: 'bench' as const, x: 1, y: 2, width: 2, height: 1 };
    await createGardenFeature(gardenId, payload);
    expect(api.post).toHaveBeenCalledWith(`/gardens/${gardenId}/features/`, payload);
  });
});

describe('updateGardenFeature', () => {
  it('calls PATCH /gardens/:id/features/:featureId/ with the payload', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: feature });
    await updateGardenFeature(gardenId, featureId, { x: 3, y: 4 });
    expect(api.patch).toHaveBeenCalledWith(`/gardens/${gardenId}/features/${featureId}/`, { x: 3, y: 4 });
  });
});

describe('deleteGardenFeature', () => {
  it('calls DELETE /gardens/:id/features/:featureId/', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null });
    await deleteGardenFeature(gardenId, featureId);
    expect(api.delete).toHaveBeenCalledWith(`/gardens/${gardenId}/features/${featureId}/`);
  });
});

describe('fetchBedFeatures', () => {
  it('calls GET /gardens/:gardenId/beds/:bedId/features/ and returns data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [feature] });
    const result = await fetchBedFeatures(gardenId, bedId);
    expect(api.get).toHaveBeenCalledWith(`/gardens/${gardenId}/beds/${bedId}/features/`);
    expect(result).toEqual([feature]);
  });

  it('returns an empty array when data is null', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: null });
    expect(await fetchBedFeatures(gardenId, bedId)).toEqual([]);
  });
});

describe('createBedFeature', () => {
  it('calls POST /gardens/:gardenId/beds/:bedId/features/ with the payload', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: feature });
    const payload = { objectType: 'trellis' as const, x: 0, y: 0, width: 1, height: 3 };
    await createBedFeature(gardenId, bedId, payload);
    expect(api.post).toHaveBeenCalledWith(`/gardens/${gardenId}/beds/${bedId}/features/`, payload);
  });
});

describe('updateBedFeature', () => {
  it('calls PATCH /gardens/:gardenId/beds/:bedId/features/:featureId/ with the payload', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: feature });
    await updateBedFeature(gardenId, bedId, featureId, { width: 4, height: 2 });
    expect(api.patch).toHaveBeenCalledWith(
      `/gardens/${gardenId}/beds/${bedId}/features/${featureId}/`,
      { width: 4, height: 2 },
    );
  });
});

describe('deleteBedFeature', () => {
  it('calls DELETE /gardens/:gardenId/beds/:bedId/features/:featureId/', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null });
    await deleteBedFeature(gardenId, bedId, featureId);
    expect(api.delete).toHaveBeenCalledWith(`/gardens/${gardenId}/beds/${bedId}/features/${featureId}/`);
  });
});
