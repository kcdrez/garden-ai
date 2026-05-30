import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@/test/test-utils';
import { fetchGarden } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import { mockGarden, mockBed } from '@/test/fixtures';
import { useGardenDetail } from './useGardenDetail';

vi.mock('@/api/gardens', () => ({ fetchGarden: vi.fn() }));
vi.mock('@/api/beds', () => ({ fetchBeds: vi.fn() }));

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
  vi.mocked(fetchGarden).mockResolvedValue(mockGarden);
  vi.mocked(fetchBeds).mockResolvedValue([mockBed]);
});

describe('useGardenDetail', () => {
  it('fetches garden and beds when id is provided', async () => {
    const { result } = renderHook(() => useGardenDetail('garden-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.gardenLoading).toBe(false));
    expect(result.current.garden).toEqual(mockGarden);
    expect(result.current.beds).toEqual([mockBed]);
  });

  it('does not fetch when id is undefined', () => {
    const { result } = renderHook(() => useGardenDetail(undefined), { wrapper: createWrapper() });
    expect(fetchGarden).not.toHaveBeenCalled();
    expect(fetchBeds).not.toHaveBeenCalled();
    expect(result.current.gardenLoading).toBe(false);
  });

  it('exposes gardenError when the garden fetch fails', async () => {
    const error = new Error('Not found');
    vi.mocked(fetchGarden).mockRejectedValue(error);
    const { result } = renderHook(() => useGardenDetail('garden-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.gardenError).toBeTruthy());
  });

  it('seeds garden from the all-gardens cache without fetching', async () => {
    const wrapper = createWrapper((qc) => {
      qc.setQueryData(['gardens'], [mockGarden]);
    });
    const { result } = renderHook(() => useGardenDetail('garden-1'), { wrapper });

    expect(result.current.garden).toEqual(mockGarden);
    expect(fetchGarden).not.toHaveBeenCalled();
  });

  it('seeds beds from the all-beds cache without fetching', async () => {
    const wrapper = createWrapper((qc) => {
      qc.setQueryData(['beds', 'all'], [mockBed]);
    });
    const { result } = renderHook(() => useGardenDetail('garden-1'), { wrapper });

    expect(result.current.beds).toEqual([mockBed]);
    expect(fetchBeds).not.toHaveBeenCalled();
  });

  it('filters the all-beds cache to only beds belonging to the garden', async () => {
    const otherBed = { ...mockBed, id: 'bed-99', garden: 'garden-99' };
    const wrapper = createWrapper((qc) => {
      qc.setQueryData(['beds', 'all'], [mockBed, otherBed]);
    });
    const { result } = renderHook(() => useGardenDetail('garden-1'), { wrapper });

    expect(result.current.beds).toEqual([mockBed]);
    expect(result.current.beds).not.toContainEqual(otherBed);
  });
});
