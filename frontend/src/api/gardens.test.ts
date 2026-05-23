import { fetchGardens, fetchGarden, createGarden, updateGarden, deleteGarden } from './gardens';
import { api } from './client';

vi.mock('./client', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

describe('fetchGardens', () => {
  it('calls GET /gardens/ and returns the data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [{ id: 'g1' }] });
    const result = await fetchGardens();
    expect(api.get).toHaveBeenCalledWith('/gardens/');
    expect(result).toEqual([{ id: 'g1' }]);
  });

  it('returns an empty array when data is null', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: null });
    expect(await fetchGardens()).toEqual([]);
  });
});

describe('fetchGarden', () => {
  it('calls GET /gardens/:id/', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { id: 'g1' } });
    await fetchGarden('g1');
    expect(api.get).toHaveBeenCalledWith('/gardens/g1/');
  });
});

describe('createGarden', () => {
  it('calls POST /gardens/ with the payload', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'g1' } });
    await createGarden({ name: 'Front Yard' });
    expect(api.post).toHaveBeenCalledWith('/gardens/', { name: 'Front Yard' });
  });
});

describe('updateGarden', () => {
  it('calls PATCH /gardens/:id/ with the payload', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { id: 'g1' } });
    await updateGarden('g1', { name: 'Updated' });
    expect(api.patch).toHaveBeenCalledWith('/gardens/g1/', { name: 'Updated' });
  });
});

describe('deleteGarden', () => {
  it('calls DELETE /gardens/:id/', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: null });
    await deleteGarden('g1');
    expect(api.delete).toHaveBeenCalledWith('/gardens/g1/');
  });
});
