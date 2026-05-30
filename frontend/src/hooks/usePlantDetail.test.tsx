import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@/test/test-utils';
import { fetchUserPlant } from '@/api/plants';
import { mockUserPlant } from '@/test/fixtures';
import { usePlantDetail } from './usePlantDetail';

vi.mock('@/api/plants', () => ({ fetchUserPlant: vi.fn() }));

function createWrapper(preload?: (qc: QueryClient) => void) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  preload?.(queryClient);
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.mocked(fetchUserPlant).mockResolvedValue(mockUserPlant);
});

describe('usePlantDetail', () => {
  it('fetches plant when plantId is provided', async () => {
    const { result } = renderHook(() => usePlantDetail('plant-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.plant).toEqual(mockUserPlant);
  });

  it('does not fetch when plantId is undefined', () => {
    const { result } = renderHook(() => usePlantDetail(undefined), { wrapper: createWrapper() });
    expect(fetchUserPlant).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes error when the plant fetch fails', async () => {
    vi.mocked(fetchUserPlant).mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => usePlantDetail('plant-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.error).toBeTruthy());
  });

  it('seeds plant from the all-plants cache without fetching', async () => {
    const wrapper = createWrapper((qc) => {
      qc.setQueryData(['plants', 'user', 'all'], [mockUserPlant]);
    });
    const { result } = renderHook(() => usePlantDetail('plant-1'), { wrapper });

    expect(result.current.plant).toEqual(mockUserPlant);
    expect(fetchUserPlant).not.toHaveBeenCalled();
  });

  it('does not seed plant from a cache entry for a different plant id', () => {
    const otherPlant = { ...mockUserPlant, id: 'plant-99' };
    const wrapper = createWrapper((qc) => {
      qc.setQueryData(['plants', 'user', 'all'], [otherPlant]);
    });
    const { result } = renderHook(() => usePlantDetail('plant-1'), { wrapper });

    // initialData returned undefined (no matching plant) — plant is undefined at mount before fetch resolves
    expect(result.current.plant).toBeUndefined();
  });
});
