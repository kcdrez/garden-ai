import {
  fetchAllBeds, fetchBeds, createBed, updateBed, deleteBed,
  fetchBedPlacements, createBedPlacement, deleteBedPlacement,
} from './beds';
import { api } from './client';

vi.mock('./client', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

const payload = { name: 'Raised Bed', length: 4, width: 4, unit: 'ft' };

describe('fetchAllBeds', () => {
  it('calls GET /beds/ and returns the data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [{ id: 'b1' }] });
    const result = await fetchAllBeds();
    expect(api.get).toHaveBeenCalledWith('/beds/');
    expect(result).toEqual([{ id: 'b1' }]);
  });

  it('returns an empty array when data is null', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: null });
    expect(await fetchAllBeds()).toEqual([]);
  });
});

describe('fetchBeds', () => {
  it('calls GET /gardens/:gardenId/beds/', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    await fetchBeds('g1');
    expect(api.get).toHaveBeenCalledWith('/gardens/g1/beds/');
  });
});

describe('createBed', () => {
  it('calls POST /gardens/:gardenId/beds/ with the payload', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'b1' } });
    await createBed('g1', payload);
    expect(api.post).toHaveBeenCalledWith('/gardens/g1/beds/', payload);
  });
});

describe('updateBed', () => {
  it('calls PATCH /gardens/:gardenId/beds/:bedId/ with the payload', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { id: 'b1' } });
    await updateBed('g1', 'b1', { name: 'Updated' });
    expect(api.patch).toHaveBeenCalledWith('/gardens/g1/beds/b1/', { name: 'Updated' });
  });
});

describe('deleteBed', () => {
  it('calls DELETE /gardens/:gardenId/beds/:bedId/', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null });
    await deleteBed('g1', 'b1');
    expect(api.delete).toHaveBeenCalledWith('/gardens/g1/beds/b1/');
  });
});

describe('fetchBedPlacements', () => {
  it('calls GET /gardens/:gardenId/bed-placements/', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    await fetchBedPlacements('g1');
    expect(api.get).toHaveBeenCalledWith('/gardens/g1/bed-placements/');
  });
});

describe('createBedPlacement', () => {
  it('calls POST /gardens/:gardenId/bed-placements/ with the payload', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'p1' } });
    await createBedPlacement('g1', { bed: 'b1', x: 0, y: 0, width: 2, height: 2 });
    expect(api.post).toHaveBeenCalledWith('/gardens/g1/bed-placements/', { bed: 'b1', x: 0, y: 0, width: 2, height: 2 });
  });
});

describe('deleteBedPlacement', () => {
  it('calls DELETE /gardens/:gardenId/bed-placements/:placementId/', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null });
    await deleteBedPlacement('g1', 'p1');
    expect(api.delete).toHaveBeenCalledWith('/gardens/g1/bed-placements/p1/');
  });
});
