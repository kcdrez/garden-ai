import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchUserPlant, deleteUserPlant } from '@/api/plants';
import { mockNavigate, mockUseParams } from '@/test/test-setup';
import { mockUserPlant } from '@/test/fixtures';
import type { UserPlant } from '@/types/plants';
import PlantDetail from './PlantDetail';

vi.mock('@/api/plants', () => ({ fetchUserPlant: vi.fn(), deleteUserPlant: vi.fn() }));

vi.mock('@/components/plants/PlantTimeline', () => ({
  default: () => <div>Plant Timeline</div>,
}));
vi.mock('@/components/plants/UserPlantDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Edit Plant Dialog" /> : null,
}));
vi.mock('@/components/plants/MovePlantDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Move Plant Dialog" /> : null,
}));
vi.mock('@/components/plants/StatusBadge', () => ({
  default: ({ status }: { status: UserPlant['status'] }) => <span>{status}</span>,
}));

const mockConfirm = vi.fn();
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  mockUseParams.mockReturnValue({ plantId: 'plant-1' });
  vi.mocked(fetchUserPlant).mockResolvedValue(mockUserPlant);
  vi.mocked(deleteUserPlant).mockResolvedValue(undefined);
  mockConfirm.mockResolvedValue(true);
});

describe('PlantDetail', () => {
  it('shows a loading indicator while the plant loads', () => {
    vi.mocked(fetchUserPlant).mockImplementation(() => new Promise(() => {}));
    render(<PlantDetail />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the plant name and status', async () => {
    render(<PlantDetail />);

    expect(await screen.findByRole('heading', { name: 'Tomato' })).toBeInTheDocument();
    expect(screen.getByText('growing')).toBeInTheDocument();
  });

  it('opens the edit dialog when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<PlantDetail />);

    await waitFor(() => screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('dialog', { name: /edit plant dialog/i })).toBeInTheDocument();
  });

  it('opens the move dialog when Move is clicked', async () => {
    const user = userEvent.setup();
    render(<PlantDetail />);

    await waitFor(() => screen.getByRole('button', { name: /move/i }));
    await user.click(screen.getByRole('button', { name: /move/i }));

    expect(screen.getByRole('dialog', { name: /move plant dialog/i })).toBeInTheDocument();
  });

  it('calls deleteUserPlant after confirming delete', async () => {
    const user = userEvent.setup();
    render(<PlantDetail />);

    await waitFor(() => screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(deleteUserPlant).toHaveBeenCalledWith('garden-1', 'bed-1', 'plant-1'));
  });

  it('does not delete when confirm is cancelled', async () => {
    mockConfirm.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<PlantDetail />);

    await waitFor(() => screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(deleteUserPlant).not.toHaveBeenCalled();
  });

  it('navigates back to the bed after successful delete', async () => {
    const user = userEvent.setup();
    render(<PlantDetail />);

    await waitFor(() => screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/gardens/garden-1/beds/bed-1')
    );
  });
});
