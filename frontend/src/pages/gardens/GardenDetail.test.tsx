import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchGarden, deleteGarden } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import { mockNavigate, mockUseParams } from '@/test/test-setup';
import { mockGarden, mockBed } from '@/test/fixtures';
import type { Garden, GardenBed } from '@/types/gardens';
import GardenDetail from './GardenDetail';

vi.mock('@/api/gardens', () => ({ fetchGarden: vi.fn(), deleteGarden: vi.fn() }));
vi.mock('@/api/beds', () => ({ fetchBeds: vi.fn() }));

vi.mock('@/components/beds/BedItem', () => ({
  default: ({ bed }: { bed: GardenBed }) => <div data-testid="bed-item">{bed.name}</div>,
}));
vi.mock('@/components/beds/BedDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Add Bed Dialog" /> : null,
}));
vi.mock('@/components/gardens/GardenDialog', () => ({
  default: ({ open, garden }: { open: boolean; garden: Garden }) =>
    open ? <div role="dialog" aria-label={`Edit ${garden.name}`} /> : null,
}));
vi.mock('@/components/gardens/GardenGrid', () => ({
  default: () => <div>Garden Grid</div>,
}));

const mockConfirm = vi.fn();
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  mockUseParams.mockReturnValue({ id: 'garden-1' });
  vi.mocked(fetchGarden).mockResolvedValue(mockGarden);
  vi.mocked(fetchBeds).mockResolvedValue([]);
  vi.mocked(deleteGarden).mockResolvedValue(undefined);
  mockConfirm.mockResolvedValue(true);
});

describe('GardenDetail', () => {
  it('shows a loading indicator while the garden loads', () => {
    vi.mocked(fetchGarden).mockImplementation(() => new Promise(() => {}));
    render(<GardenDetail />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the garden name and description', async () => {
    render(<GardenDetail />);

    expect(await screen.findByRole('heading', { name: 'Front Yard' })).toBeInTheDocument();
    expect(screen.getByText('My main garden')).toBeInTheDocument();
  });

  it('renders bed items when beds exist', async () => {
    vi.mocked(fetchBeds).mockResolvedValue([mockBed]);
    render(<GardenDetail />);

    await waitFor(() => expect(screen.getAllByTestId('bed-item')).toHaveLength(1));
    expect(screen.getByText('Raised Bed 1')).toBeInTheDocument();
  });

  it('opens the edit garden dialog when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<GardenDetail />);

    await waitFor(() => screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('dialog', { name: /edit front yard/i })).toBeInTheDocument();
  });

  it('calls deleteGarden after confirming delete', async () => {
    const user = userEvent.setup();
    render(<GardenDetail />);

    await waitFor(() => screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(deleteGarden).toHaveBeenCalledWith('garden-1'));
  });

  it('does not delete when confirm is cancelled', async () => {
    mockConfirm.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<GardenDetail />);

    await waitFor(() => screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(deleteGarden).not.toHaveBeenCalled();
  });

  it('navigates to gardens list after successful delete', async () => {
    const user = userEvent.setup();
    render(<GardenDetail />);

    await waitFor(() => screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/gardens'));
  });
});
