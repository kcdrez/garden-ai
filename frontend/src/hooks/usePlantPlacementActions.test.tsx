import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@/test/test-utils';
import {
  fetchPlacements, createPlacement, movePlacement, resizePlacement,
  deletePlacement, cloneUserPlant, deleteUserPlant,
} from '@/api/plants';
import { usePlantPlacementActions } from './usePlantPlacementActions';

vi.mock('@/api/plants', () => ({
  fetchPlacements: vi.fn(),
  createPlacement: vi.fn(),
  movePlacement: vi.fn(),
  resizePlacement: vi.fn(),
  deletePlacement: vi.fn(),
  cloneUserPlant: vi.fn(),
  deleteUserPlant: vi.fn(),
}));

const gardenId = 'garden-1';
const bedId = 'bed-1';
const placement = {
  id: 'pp-1',
  userPlant: 'plant-1',
  bed: bedId,
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  createdAt: '',
  updatedAt: '',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.mocked(fetchPlacements).mockResolvedValue([placement]);
  vi.mocked(createPlacement).mockResolvedValue(placement);
  vi.mocked(movePlacement).mockResolvedValue(placement);
  vi.mocked(resizePlacement).mockResolvedValue(placement);
  vi.mocked(deletePlacement).mockResolvedValue(undefined);
  vi.mocked(cloneUserPlant).mockResolvedValue({ id: 'plant-2' } as never);
  vi.mocked(deleteUserPlant).mockResolvedValue(undefined);
});

describe('usePlantPlacementActions', () => {
  it('fetches placements on mount', async () => {
    const { result } = renderHook(() => usePlantPlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.placements).toEqual([placement]);
  });

  it('createPlacement calls the API and fires onSuccess callback', async () => {
    const { result } = renderHook(() => usePlantPlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const onSuccess = vi.fn();

    act(() => result.current.createPlacement({ userPlantId: 'plant-1', x: 1, y: 2, width: 1, height: 1 }, onSuccess));

    await waitFor(() =>
      expect(createPlacement).toHaveBeenCalledWith(gardenId, bedId, { userPlant: 'plant-1', x: 1, y: 2, width: 1, height: 1 }),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('isCreating is true while createPlacement is in flight', async () => {
    vi.mocked(createPlacement).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePlantPlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.createPlacement({ userPlantId: 'plant-1', x: 0, y: 0, width: 1, height: 1 }));

    await waitFor(() => expect(result.current.isCreating).toBe(true));
  });

  it('movePlacement applies an optimistic update immediately', async () => {
    vi.mocked(movePlacement).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePlantPlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.placements).toHaveLength(1));

    act(() => result.current.movePlacement({ placementId: 'pp-1', x: 5, y: 6 }));

    await waitFor(() => {
      expect(result.current.placements.find((p) => p.id === 'pp-1')).toMatchObject({ x: 5, y: 6 });
    });
  });

  it('movePlacement rolls back on error and exposes mutationError', async () => {
    vi.mocked(movePlacement).mockRejectedValue(new Error('server error'));
    const { result } = renderHook(() => usePlantPlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.placements).toHaveLength(1));

    act(() => result.current.movePlacement({ placementId: 'pp-1', x: 9, y: 8 }));

    await waitFor(() => {
      expect(result.current.placements.find((p) => p.id === 'pp-1')).toMatchObject({ x: 0, y: 0 });
    });
    expect(result.current.mutationError).toBe('server error');
  });

  it('resizePlacement applies an optimistic update immediately', async () => {
    vi.mocked(resizePlacement).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePlantPlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.placements).toHaveLength(1));

    act(() => result.current.resizePlacement({ placementId: 'pp-1', widthFt: 3, heightFt: 2 }));

    await waitFor(() => {
      expect(result.current.placements.find((p) => p.id === 'pp-1')).toMatchObject({ width: 3, height: 2 });
    });
  });

  it('resizePlacement rolls back on error', async () => {
    vi.mocked(resizePlacement).mockRejectedValue(new Error('out of bounds'));
    const { result } = renderHook(() => usePlantPlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.placements).toHaveLength(1));

    act(() => result.current.resizePlacement({ placementId: 'pp-1', widthFt: 99, heightFt: 99 }));

    await waitFor(() => {
      expect(result.current.placements.find((p) => p.id === 'pp-1')).toMatchObject({ width: 1, height: 1 });
    });
    expect(result.current.mutationError).toBe('out of bounds');
  });

  it('removePlacement calls the API with the placement id', async () => {
    const { result } = renderHook(() => usePlantPlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.removePlacement('pp-1'));

    await waitFor(() => expect(deletePlacement).toHaveBeenCalledWith(gardenId, bedId, 'pp-1'));
  });

  it('clonePlant calls the API with plantId and optional placement', async () => {
    const { result } = renderHook(() => usePlantPlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.clonePlant({ plantId: 'plant-1', placement: { x: 1, y: 0, width: 1, height: 1 } }));

    await waitFor(() =>
      expect(cloneUserPlant).toHaveBeenCalledWith(gardenId, bedId, 'plant-1', { x: 1, y: 0, width: 1, height: 1 }),
    );
  });

  it('deletePlant clears mutationError on success', async () => {
    vi.mocked(movePlacement).mockRejectedValue(new Error('oops'));
    const { result } = renderHook(() => usePlantPlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.placements).toHaveLength(1));

    act(() => result.current.movePlacement({ placementId: 'pp-1', x: 0, y: 0 }));
    await waitFor(() => expect(result.current.mutationError).toBeTruthy());

    act(() => result.current.deletePlant('plant-1'));
    await waitFor(() => expect(deleteUserPlant).toHaveBeenCalledWith(gardenId, bedId, 'plant-1'));
    await waitFor(() => expect(result.current.mutationError).toBeNull());
  });

  it('resetCreate clears createFailed', async () => {
    vi.mocked(createPlacement).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => usePlantPlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.createPlacement({ userPlantId: 'plant-1', x: 0, y: 0, width: 1, height: 1 }));
    await waitFor(() => expect(result.current.createFailed).toBe(true));

    act(() => result.current.resetCreate());
    await waitFor(() => expect(result.current.createFailed).toBe(false));
  });
});
