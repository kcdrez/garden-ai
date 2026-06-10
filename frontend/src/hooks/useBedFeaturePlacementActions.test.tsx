import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@/test/test-utils';
import { fetchBedFeatures, createBedFeature, updateBedFeature, deleteBedFeature } from '@/api/features';
import { useBedFeaturePlacementActions } from './useBedFeaturePlacementActions';

vi.mock('@/api/features', () => ({
  fetchBedFeatures: vi.fn(),
  createBedFeature: vi.fn(),
  updateBedFeature: vi.fn(),
  deleteBedFeature: vi.fn(),
}));

const gardenId = 'garden-1';
const bedId = 'bed-1';
const feature = {
  id: 'feat-1',
  objectType: 'bench' as const,
  shape: 'rect' as const,
  label: 'Bench',
  x: 0,
  y: 0,
  width: 2,
  height: 1,
  rotation: 0,
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
  vi.mocked(fetchBedFeatures).mockResolvedValue([feature]);
  vi.mocked(createBedFeature).mockResolvedValue(feature);
  vi.mocked(updateBedFeature).mockResolvedValue(feature);
  vi.mocked(deleteBedFeature).mockResolvedValue(undefined);
});

describe('useBedFeaturePlacementActions', () => {
  it('fetches features on mount', async () => {
    const { result } = renderHook(() => useBedFeaturePlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.features).toEqual([feature]);
  });

  it('createFeature calls the API with correct args', async () => {
    const { result } = renderHook(() => useBedFeaturePlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.createFeature({ objectType: 'bench', x: 1, y: 2, width: 2, height: 1 }));

    await waitFor(() =>
      expect(createBedFeature).toHaveBeenCalledWith(gardenId, bedId, { objectType: 'bench', x: 1, y: 2, width: 2, height: 1 }),
    );
  });

  it('createFeature fires onSuccess callback', async () => {
    const { result } = renderHook(() => useBedFeaturePlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const onSuccess = vi.fn();

    act(() => result.current.createFeature({ objectType: 'bench', x: 0, y: 0, width: 1, height: 1 }, onSuccess));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('moveFeature applies an optimistic update immediately', async () => {
    vi.mocked(updateBedFeature).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useBedFeaturePlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.features).toHaveLength(1));

    act(() => result.current.moveFeature({ featureId: 'feat-1', x: 5, y: 6 }));

    await waitFor(() => {
      expect(result.current.features.find((f) => f.id === 'feat-1')).toMatchObject({ x: 5, y: 6 });
    });
  });

  it('moveFeature rolls back the optimistic update on error', async () => {
    vi.mocked(updateBedFeature).mockRejectedValue(new Error('server error'));
    const { result } = renderHook(() => useBedFeaturePlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.features).toHaveLength(1));

    act(() => result.current.moveFeature({ featureId: 'feat-1', x: 9, y: 8 }));

    await waitFor(() => {
      expect(result.current.features.find((f) => f.id === 'feat-1')).toMatchObject({ x: 0, y: 0 });
    });
  });

  it('resizeFeature applies an optimistic update immediately', async () => {
    vi.mocked(updateBedFeature).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useBedFeaturePlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.features).toHaveLength(1));

    act(() => result.current.resizeFeature({ featureId: 'feat-1', width: 5, height: 3 }));

    await waitFor(() => {
      expect(result.current.features.find((f) => f.id === 'feat-1')).toMatchObject({ width: 5, height: 3 });
    });
  });

  it('resizeFeature rolls back on error', async () => {
    vi.mocked(updateBedFeature).mockRejectedValue(new Error('out of bounds'));
    const { result } = renderHook(() => useBedFeaturePlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.features).toHaveLength(1));

    act(() => result.current.resizeFeature({ featureId: 'feat-1', width: 99, height: 99 }));

    await waitFor(() => {
      expect(result.current.features.find((f) => f.id === 'feat-1')).toMatchObject({ width: 2, height: 1 });
    });
  });

  it('updateFeatureLabel calls the API with correct args', async () => {
    const { result } = renderHook(() => useBedFeaturePlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.updateFeatureLabel({ featureId: 'feat-1', label: 'New Label' }));

    await waitFor(() =>
      expect(updateBedFeature).toHaveBeenCalledWith(gardenId, bedId, 'feat-1', { label: 'New Label' }),
    );
  });

  it('removeFeature calls the API with the feature id', async () => {
    const { result } = renderHook(() => useBedFeaturePlacementActions(gardenId, bedId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.removeFeature('feat-1'));

    await waitFor(() => expect(deleteBedFeature).toHaveBeenCalledWith(gardenId, bedId, 'feat-1'));
  });
});
