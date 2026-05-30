import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@/test/test-utils';
import { fetchBedPlacements, createBedPlacement, moveBedPlacement, deleteBedPlacement } from '@/api/beds';
import { useBedPlacementActions } from './useBedPlacementActions';

vi.mock('@/api/beds', () => ({
  fetchBedPlacements: vi.fn(),
  createBedPlacement: vi.fn(),
  moveBedPlacement: vi.fn(),
  deleteBedPlacement: vi.fn(),
}));

const gardenId = 'garden-1';
const placement = {
  id: 'bp-1',
  bed: 'bed-1',
  garden: gardenId,
  x: 0,
  y: 0,
  bedWidthFt: 4,
  bedHeightFt: 4,
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
  vi.mocked(fetchBedPlacements).mockResolvedValue([placement]);
  vi.mocked(createBedPlacement).mockResolvedValue(placement);
  vi.mocked(moveBedPlacement).mockResolvedValue(placement);
  vi.mocked(deleteBedPlacement).mockResolvedValue(undefined);
});

describe('useBedPlacementActions', () => {
  it('fetches placements on mount', async () => {
    const { result } = renderHook(() => useBedPlacementActions(gardenId), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.placements).toEqual([placement]);
  });

  it('createPlacement calls the API with the correct args', async () => {
    const { result } = renderHook(() => useBedPlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.createPlacement({ bedId: 'bed-1', x: 2, y: 3 }));

    await waitFor(() =>
      expect(createBedPlacement).toHaveBeenCalledWith(gardenId, { bed: 'bed-1', x: 2, y: 3 }),
    );
  });

  it('isCreating is true while createPlacement is in flight', async () => {
    vi.mocked(createBedPlacement).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useBedPlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.createPlacement({ bedId: 'bed-1', x: 0, y: 0 }));

    await waitFor(() => expect(result.current.isCreating).toBe(true));
  });

  it('createFailed and createError are set when createPlacement fails', async () => {
    const error = new Error('Out of bounds');
    vi.mocked(createBedPlacement).mockRejectedValue(error);
    const { result } = renderHook(() => useBedPlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.createPlacement({ bedId: 'bed-1', x: 0, y: 0 }));

    await waitFor(() => expect(result.current.createFailed).toBe(true));
    expect(result.current.createError).toBe(error);
  });

  it('resetCreate clears the error state', async () => {
    vi.mocked(createBedPlacement).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useBedPlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.createPlacement({ bedId: 'bed-1', x: 0, y: 0 }));
    await waitFor(() => expect(result.current.createFailed).toBe(true));

    act(() => result.current.resetCreate());
    await waitFor(() => expect(result.current.createFailed).toBe(false));
    expect(result.current.createError).toBeNull();
  });

  it('movePlacement calls the API with the correct args', async () => {
    const { result } = renderHook(() => useBedPlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.movePlacement({ placementId: 'bp-1', x: 5, y: 6 }));

    await waitFor(() =>
      expect(moveBedPlacement).toHaveBeenCalledWith(gardenId, 'bp-1', 5, 6),
    );
  });

  it('movePlacement applies an optimistic update immediately', async () => {
    vi.mocked(moveBedPlacement).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useBedPlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.placements).toHaveLength(1));

    act(() => result.current.movePlacement({ placementId: 'bp-1', x: 9, y: 8 }));

    await waitFor(() => {
      const moved = result.current.placements.find((p) => p.id === 'bp-1');
      expect(moved).toMatchObject({ x: 9, y: 8 });
    });
  });

  it('movePlacement rolls back the optimistic update on error', async () => {
    vi.mocked(moveBedPlacement).mockRejectedValue(new Error('server error'));
    const { result } = renderHook(() => useBedPlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.placements).toHaveLength(1));

    act(() => result.current.movePlacement({ placementId: 'bp-1', x: 9, y: 8 }));

    await waitFor(() => {
      const p = result.current.placements.find((pl) => pl.id === 'bp-1');
      expect(p).toMatchObject({ x: 0, y: 0 });
    });
  });

  it('removePlacement calls the API with the placement id', async () => {
    const { result } = renderHook(() => useBedPlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.removePlacement('bp-1'));

    await waitFor(() =>
      expect(deleteBedPlacement).toHaveBeenCalledWith(gardenId, 'bp-1'),
    );
  });
});
