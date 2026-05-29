import { renderHook, act, waitFor } from '@/test/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cloneUserPlant, deleteUserPlant } from '@/api/plants';
import { useConfirm } from '@/hooks/useConfirm';
import { mockUserPlant } from '@/test/fixtures';
import { usePlantActions } from './usePlantActions';

vi.mock('@/api/plants', () => ({
  cloneUserPlant: vi.fn(),
  deleteUserPlant: vi.fn(),
}));

vi.mock('@/hooks/useConfirm', () => ({ useConfirm: vi.fn() }));

const mockConfirm = vi.fn();

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.mocked(useConfirm).mockReturnValue(mockConfirm);
  vi.mocked(cloneUserPlant).mockResolvedValue(mockUserPlant);
  vi.mocked(deleteUserPlant).mockResolvedValue();
  mockConfirm.mockReset();
});

describe('usePlantActions', () => {
  it('initialises editOpen and moveOpen to false', () => {
    const { result } = renderHook(() => usePlantActions(mockUserPlant), {
      wrapper: makeWrapper(),
    });
    expect(result.current.editOpen).toBe(false);
    expect(result.current.moveOpen).toBe(false);
  });

  it('setEditOpen toggles the edit dialog state', () => {
    const { result } = renderHook(() => usePlantActions(mockUserPlant), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.setEditOpen(true));
    expect(result.current.editOpen).toBe(true);
    act(() => result.current.setEditOpen(false));
    expect(result.current.editOpen).toBe(false);
  });

  it('setMoveOpen toggles the move dialog state', () => {
    const { result } = renderHook(() => usePlantActions(mockUserPlant), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.setMoveOpen(true));
    expect(result.current.moveOpen).toBe(true);
  });

  it('cloneMutation calls cloneUserPlant with the correct ids', async () => {
    const { result } = renderHook(() => usePlantActions(mockUserPlant), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.cloneMutation.mutate());
    await waitFor(() =>
      expect(cloneUserPlant).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        'plant-1',
      ),
    );
  });

  it('deleteMutation calls deleteUserPlant with the correct ids', async () => {
    const { result } = renderHook(() => usePlantActions(mockUserPlant), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.deleteMutation.mutate());
    await waitFor(() =>
      expect(deleteUserPlant).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        'plant-1',
      ),
    );
  });

  it('handleDelete shows a confirm dialog with the plant name', async () => {
    mockConfirm.mockResolvedValue(false);
    const { result } = renderHook(() => usePlantActions(mockUserPlant), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.handleDelete();
    });
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('Tomato'),
      }),
    );
  });

  it('handleDelete includes the variety in the description when set', async () => {
    mockConfirm.mockResolvedValue(false);
    const plant = { ...mockUserPlant, variety: 'Roma' };
    const { result } = renderHook(() => usePlantActions(plant), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.handleDelete();
    });
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining('Roma') }),
    );
  });

  it('handleDelete calls deleteUserPlant when confirm resolves true', async () => {
    mockConfirm.mockResolvedValue(true);
    const { result } = renderHook(() => usePlantActions(mockUserPlant), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.handleDelete();
    });
    await waitFor(() => expect(deleteUserPlant).toHaveBeenCalledOnce());
  });

  it('handleDelete does not call deleteUserPlant when confirm resolves false', async () => {
    mockConfirm.mockResolvedValue(false);
    const { result } = renderHook(() => usePlantActions(mockUserPlant), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await result.current.handleDelete();
    });
    expect(deleteUserPlant).not.toHaveBeenCalled();
  });

  it('calls onDeleteSuccess after a successful delete', async () => {
    mockConfirm.mockResolvedValue(true);
    const onDeleteSuccess = vi.fn();
    const { result } = renderHook(
      () => usePlantActions(mockUserPlant, { onDeleteSuccess }),
      { wrapper: makeWrapper() },
    );
    await act(async () => {
      await result.current.handleDelete();
    });
    await waitFor(() => expect(onDeleteSuccess).toHaveBeenCalledOnce());
  });
});
