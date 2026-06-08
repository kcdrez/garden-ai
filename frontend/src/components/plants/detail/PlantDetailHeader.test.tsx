import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { deleteUserPlant } from '@/api/plants';
import { mockNavigate } from '@/test/test-setup';
import { mockUserPlant } from '@/test/fixtures';
import type { UserPlant } from '@/types/plants';
import PlantDetailHeader from './PlantDetailHeader';

vi.mock('@/api/plants', () => ({ deleteUserPlant: vi.fn() }));

vi.mock('@/components/plants/detail/PlantEditForm', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Edit Plant Form" /> : null,
}));
vi.mock('@/components/plants/dialogs/MovePlantDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Move Plant Dialog" /> : null,
}));
vi.mock('@/components/plants/shared/StatusBadge', () => ({
  default: ({ status }: { status: UserPlant['status'] }) => <span>{status}</span>,
}));

const mockConfirm = vi.fn();
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  vi.mocked(deleteUserPlant).mockResolvedValue(undefined);
  mockConfirm.mockResolvedValue(true);
});

describe('PlantDetailHeader', () => {
  it('renders the plant name and status', () => {
    render(<PlantDetailHeader plant={mockUserPlant} />);

    expect(screen.getByRole('heading', { name: 'Tomato' })).toBeInTheDocument();
    expect(screen.getByText('growing')).toBeInTheDocument();
  });

  it('renders breadcrumb links to the garden and bed', () => {
    render(<PlantDetailHeader plant={mockUserPlant} />);

    expect(screen.getByRole('link', { name: 'Front Yard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Raised Bed 1' })).toBeInTheDocument();
  });

  it('does not show the metadata card when plant has no startDate or notes', () => {
    render(<PlantDetailHeader plant={mockUserPlant} />);

    expect(screen.queryByText(/started/i)).not.toBeInTheDocument();
  });

  it('shows the metadata card when plant has a startDate', () => {
    const plantWithDate = { ...mockUserPlant, startDate: '2024-03-01' };
    render(<PlantDetailHeader plant={plantWithDate} />);

    expect(screen.getByText(/started/i)).toBeInTheDocument();
    expect(screen.getByText('2024-03-01')).toBeInTheDocument();
  });

  it('shows the metadata card when plant has notes', () => {
    const plantWithNotes = { ...mockUserPlant, notes: 'Needs extra water' };
    render(<PlantDetailHeader plant={plantWithNotes} />);

    expect(screen.getByText('Needs extra water')).toBeInTheDocument();
  });

  it('opens the edit form when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<PlantDetailHeader plant={mockUserPlant} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('dialog', { name: /edit plant form/i })).toBeInTheDocument();
  });

  it('opens the move dialog when Move is clicked', async () => {
    const user = userEvent.setup();
    render(<PlantDetailHeader plant={mockUserPlant} />);

    await user.click(screen.getByRole('button', { name: /move/i }));

    expect(screen.getByRole('dialog', { name: /move plant dialog/i })).toBeInTheDocument();
  });

  it('calls deleteUserPlant after confirming delete', async () => {
    const user = userEvent.setup();
    render(<PlantDetailHeader plant={mockUserPlant} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() =>
      expect(deleteUserPlant).toHaveBeenCalledWith('garden-1', 'bed-1', 'plant-1'),
    );
  });

  it('does not delete when confirm is cancelled', async () => {
    mockConfirm.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<PlantDetailHeader plant={mockUserPlant} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(deleteUserPlant).not.toHaveBeenCalled();
  });

  it('navigates back to the bed after successful delete', async () => {
    const user = userEvent.setup();
    render(<PlantDetailHeader plant={mockUserPlant} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/gardens/garden-1/beds/bed-1'),
    );
  });
});
