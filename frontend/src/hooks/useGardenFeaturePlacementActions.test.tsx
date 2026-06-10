import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@/test/test-utils';
import { fetchGardenFeatures, createGardenFeature, updateGardenFeature, deleteGardenFeature } from '@/api/features';
import { useGardenFeaturePlacementActions } from './useGardenFeaturePlacementActions';

vi.mock('@/api/features', () => ({
  fetchGardenFeatures: vi.fn(),
  createGardenFeature: vi.fn(),
  updateGardenFeature: vi.fn(),
  deleteGardenFeature: vi.fn(),
}));

const gardenId = 'garden-1';
const feature = {
  id: 'feat-1',
  objectType: 'shed' as const,
  shape: 'rect' as const,
  label: 'Shed',
  x: 0,
  y: 0,
  width: 3,
  height: 2,
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
  vi.mocked(fetchGardenFeatures).mockResolvedValue([feature]);
  vi.mocked(createGardenFeature).mockResolvedValue(feature);
  vi.mocked(updateGardenFeature).mockResolvedValue(feature);
  vi.mocked(deleteGardenFeature).mockResolvedValue(undefined);
});

describe('useGardenFeaturePlacementActions', () => {
  it('fetches features on mount', async () => {
    const { result } = renderHook(() => useGardenFeaturePlacementActions(gardenId), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.features).toEqual([feature]);
  });

  it('createFeature calls the API with correct args', async () => {
    const { result } = renderHook(() => useGardenFeaturePlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.createFeature({ objectType: 'shed', x: 1, y: 2, width: 3, height: 2 }));

    await waitFor(() =>
      expect(createGardenFeature).toHaveBeenCalledWith(gardenId, { objectType: 'shed', x: 1, y: 2, width: 3, height: 2 }),
    );
  });

  it('createFeature fires onSuccess callback', async () => {
    const { result } = renderHook(() => useGardenFeaturePlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const onSuccess = vi.fn();

    act(() => result.current.createFeature({ objectType: 'shed', x: 0, y: 0, width: 1, height: 1 }, onSuccess));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('moveFeature applies an optimistic update immediately', async () => {
    vi.mocked(updateGardenFeature).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useGardenFeaturePlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.features).toHaveLength(1));

    act(() => result.current.moveFeature({ featureId: 'feat-1', x: 5, y: 6 }));

    await waitFor(() => {
      expect(result.current.features.find((f) => f.id === 'feat-1')).toMatchObject({ x: 5, y: 6 });
    });
  });

  it('moveFeature rolls back the optimistic update on error', async () => {
    vi.mocked(updateGardenFeature).mockRejectedValue(new Error('server error'));
    const { result } = renderHook(() => useGardenFeaturePlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.features).toHaveLength(1));

    act(() => result.current.moveFeature({ featureId: 'feat-1', x: 9, y: 8 }));

    await waitFor(() => {
      expect(result.current.features.find((f) => f.id === 'feat-1')).toMatchObject({ x: 0, y: 0 });
    });
  });

  it('resizeFeature applies an optimistic update immediately', async () => {
    vi.mocked(updateGardenFeature).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useGardenFeaturePlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.features).toHaveLength(1));

    act(() => result.current.resizeFeature({ featureId: 'feat-1', width: 6, height: 4 }));

    await waitFor(() => {
      expect(result.current.features.find((f) => f.id === 'feat-1')).toMatchObject({ width: 6, height: 4 });
    });
  });

  it('resizeFeature rolls back on error', async () => {
    vi.mocked(updateGardenFeature).mockRejectedValue(new Error('out of bounds'));
    const { result } = renderHook(() => useGardenFeaturePlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.features).toHaveLength(1));

    act(() => result.current.resizeFeature({ featureId: 'feat-1', width: 99, height: 99 }));

    await waitFor(() => {
      expect(result.current.features.find((f) => f.id === 'feat-1')).toMatchObject({ width: 3, height: 2 });
    });
  });

  it('updateFeatureLabel calls the API with correct args', async () => {
    const { result } = renderHook(() => useGardenFeaturePlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.updateFeatureLabel({ featureId: 'feat-1', label: 'Tool Shed' }));

    await waitFor(() =>
      expect(updateGardenFeature).toHaveBeenCalledWith(gardenId, 'feat-1', { label: 'Tool Shed' }),
    );
  });

  it('removeFeature calls the API with the feature id', async () => {
    const { result } = renderHook(() => useGardenFeaturePlacementActions(gardenId), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.removeFeature('feat-1'));

    await waitFor(() => expect(deleteGardenFeature).toHaveBeenCalledWith(gardenId, 'feat-1'));
  });
});
