import {
  fetchAllUserPlants, fetchUserPlant, fetchUserPlants,
  createUserPlant, updateUserPlant, moveUserPlant, deleteUserPlant,
  fetchObservations, createObservation, deleteObservation,
  fetchPlacements, createPlacement, deletePlacement,
} from './plants';
import { api } from './client';

vi.mock('./client', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

describe('fetchAllUserPlants', () => {
  it('calls GET /userplants/ and returns the data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [{ id: 'p1' }] });
    const result = await fetchAllUserPlants();
    expect(api.get).toHaveBeenCalledWith('/userplants/');
    expect(result).toEqual([{ id: 'p1' }]);
  });

  it('returns an empty array when data is null', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: null });
    expect(await fetchAllUserPlants()).toEqual([]);
  });
});

describe('fetchUserPlant', () => {
  it('calls GET /userplants/:plantId/', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { id: 'p1' } });
    await fetchUserPlant('p1');
    expect(api.get).toHaveBeenCalledWith('/userplants/p1/');
  });
});

describe('fetchUserPlants', () => {
  it('calls GET /gardens/:gardenId/beds/:bedId/plants/', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    await fetchUserPlants('g1', 'b1');
    expect(api.get).toHaveBeenCalledWith('/gardens/g1/beds/b1/plants/');
  });
});

describe('createUserPlant', () => {
  it('calls POST /gardens/:gardenId/beds/:bedId/plants/ with the payload', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'p1' } });
    await createUserPlant('g1', 'b1', { plant: 'c1', status: 'planned' });
    expect(api.post).toHaveBeenCalledWith('/gardens/g1/beds/b1/plants/', { plant: 'c1', status: 'planned' });
  });
});

describe('updateUserPlant', () => {
  it('calls PATCH /gardens/:gardenId/beds/:bedId/plants/:plantId/ with the payload', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { id: 'p1' } });
    await updateUserPlant('g1', 'b1', 'p1', { status: 'growing' });
    expect(api.patch).toHaveBeenCalledWith('/gardens/g1/beds/b1/plants/p1/', { status: 'growing' });
  });
});

describe('moveUserPlant', () => {
  it('calls PATCH with the target bed id', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { id: 'p1' } });
    await moveUserPlant('g1', 'b1', 'p1', 'b2');
    expect(api.patch).toHaveBeenCalledWith('/gardens/g1/beds/b1/plants/p1/', { bed: 'b2' });
  });
});

describe('deleteUserPlant', () => {
  it('calls DELETE /gardens/:gardenId/beds/:bedId/plants/:plantId/', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null });
    await deleteUserPlant('g1', 'b1', 'p1');
    expect(api.delete).toHaveBeenCalledWith('/gardens/g1/beds/b1/plants/p1/');
  });
});

describe('fetchObservations', () => {
  it('calls GET /gardens/:gardenId/beds/:bedId/plants/:plantId/observations/', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    await fetchObservations('g1', 'b1', 'p1');
    expect(api.get).toHaveBeenCalledWith('/gardens/g1/beds/b1/plants/p1/observations/');
  });
});

describe('createObservation', () => {
  it('calls POST observations endpoint with the payload', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'o1' } });
    const data = { type: 'general' as const, observedDate: '2024-06-01', newStatus: 'growing' as const, note: 'Looks good' };
    await createObservation('g1', 'b1', 'p1', data);
    expect(api.post).toHaveBeenCalledWith('/gardens/g1/beds/b1/plants/p1/observations/', data);
  });
});

describe('deleteObservation', () => {
  it('calls DELETE observations/:observationId/', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null });
    await deleteObservation('g1', 'b1', 'p1', 'o1');
    expect(api.delete).toHaveBeenCalledWith('/gardens/g1/beds/b1/plants/p1/observations/o1/');
  });
});

describe('fetchPlacements', () => {
  it('calls GET /gardens/:gardenId/beds/:bedId/placements/', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    await fetchPlacements('g1', 'b1');
    expect(api.get).toHaveBeenCalledWith('/gardens/g1/beds/b1/placements/');
  });
});

describe('createPlacement', () => {
  it('calls POST placements endpoint with the payload', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'pl1' } });
    await createPlacement('g1', 'b1', { userPlant: 'p1', x: 0, y: 0 });
    expect(api.post).toHaveBeenCalledWith('/gardens/g1/beds/b1/placements/', { userPlant: 'p1', x: 0, y: 0 });
  });
});

describe('deletePlacement', () => {
  it('calls DELETE placements/:placementId/', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null });
    await deletePlacement('g1', 'b1', 'pl1');
    expect(api.delete).toHaveBeenCalledWith('/gardens/g1/beds/b1/placements/pl1/');
  });
});
