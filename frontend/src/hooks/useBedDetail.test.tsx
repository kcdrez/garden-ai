import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@/test/test-utils';
import { fetchBeds } from '@/api/beds';
import { fetchUserPlants } from '@/api/plants';
import { mockBed, mockUserPlant } from '@/test/fixtures';
import { useBedDetail } from './useBedDetail';

vi.mock('@/api/beds', () => ({ fetchBeds: vi.fn() }));
vi.mock('@/api/plants', () => ({ fetchUserPlants: vi.fn() }));

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
  vi.mocked(fetchBeds).mockResolvedValue([mockBed]);
  vi.mocked(fetchUserPlants).mockResolvedValue([mockUserPlant]);
});

describe('useBedDetail', () => {
  it('fetches bed and plants when ids are provided', async () => {
    const { result } = renderHook(() => useBedDetail('garden-1', 'bed-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.bedLoading).toBe(false));
    expect(result.current.bed).toEqual(mockBed);
    expect(result.current.userPlants).toEqual([mockUserPlant]);
  });

  it('does not fetch when gardenId is undefined', () => {
    const { result } = renderHook(() => useBedDetail(undefined, 'bed-1'), { wrapper: createWrapper() });
    expect(fetchBeds).not.toHaveBeenCalled();
    expect(result.current.bedLoading).toBe(false);
  });

  it('exposes bedError when the bed fetch fails', async () => {
    vi.mocked(fetchBeds).mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => useBedDetail('garden-1', 'bed-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.bedError).toBeTruthy());
  });

  it('returns undefined bed when bedId is not in the fetched list', async () => {
    vi.mocked(fetchBeds).mockResolvedValue([]);
    const { result } = renderHook(() => useBedDetail('garden-1', 'bed-99'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.bedLoading).toBe(false));
    expect(result.current.bed).toBeUndefined();
  });

  it('seeds bed from the all-beds cache without fetching', async () => {
    const wrapper = createWrapper((qc) => {
      qc.setQueryData(['beds', 'all'], [mockBed]);
    });
    const { result } = renderHook(() => useBedDetail('garden-1', 'bed-1'), { wrapper });

    expect(result.current.bed).toEqual(mockBed);
    expect(fetchBeds).not.toHaveBeenCalled();
  });

  it('seeds plants from the all-plants cache without fetching', async () => {
    const wrapper = createWrapper((qc) => {
      qc.setQueryData(['plants', 'user', 'all'], [mockUserPlant]);
    });
    const { result } = renderHook(() => useBedDetail('garden-1', 'bed-1'), { wrapper });

    expect(result.current.userPlants).toEqual([mockUserPlant]);
    expect(fetchUserPlants).not.toHaveBeenCalled();
  });

  it('filters the all-plants cache to only plants belonging to the bed', async () => {
    const otherPlant = { ...mockUserPlant, id: 'plant-99', bed: 'bed-99' };
    const wrapper = createWrapper((qc) => {
      qc.setQueryData(['plants', 'user', 'all'], [mockUserPlant, otherPlant]);
    });
    const { result } = renderHook(() => useBedDetail('garden-1', 'bed-1'), { wrapper });

    expect(result.current.userPlants).toEqual([mockUserPlant]);
    expect(result.current.userPlants).not.toContainEqual(otherPlant);
  });
});
