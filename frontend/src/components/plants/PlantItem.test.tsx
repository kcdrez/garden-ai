import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { deleteUserPlant, cloneUserPlant } from '@/api/plants';
import { mockUserPlant } from '@/test/fixtures';
import type { UserPlant } from '@/types/plants';
import PlantItem from './PlantItem';

vi.mock('@/api/plants', () => ({ deleteUserPlant: vi.fn(), cloneUserPlant: vi.fn() }));

const mockConfirm = vi.fn();
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/components/ui/card-actions-menu', () => ({
  default: ({
    onEdit,
    onClone,
    onMove,
    onDelete,
  }: {
    onEdit: () => void;
    onClone?: () => void;
    onMove?: () => void;
    onDelete: () => void;
  }) => (
    <>
      <button onClick={onEdit}>Edit</button>
      {onClone && <button onClick={onClone}>Clone</button>}
      {onMove && <button onClick={onMove}>Move to Bed</button>}
      <button onClick={onDelete}>Delete</button>
    </>
  ),
}));

vi.mock('@/components/plants/StatusBadge', () => ({
  default: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
}));

vi.mock('@/components/plants/UserPlantDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Edit Plant" /> : null,
}));

vi.mock('@/components/plants/MovePlantDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Move Plant" /> : null,
}));

describe('PlantItem', () => {
  it('renders the plant name with a link to the plant detail page', () => {
    render(<ul><PlantItem plant={mockUserPlant} /></ul>);
    const link = screen.getByRole('link', { name: 'Tomato' });
    expect(link).toHaveAttribute('href', '/plants/plant-1');
  });

  it('renders the variety when present', () => {
    const plant: UserPlant = { ...mockUserPlant, variety: 'Cherry' };
    render(<ul><PlantItem plant={plant} /></ul>);
    expect(screen.getByText(/Cherry/)).toBeInTheDocument();
  });

  it('does not render variety when absent', () => {
    render(<ul><PlantItem plant={mockUserPlant} /></ul>);
    expect(screen.queryByText(/—/)).not.toBeInTheDocument();
  });

  it('renders a link to the bed detail page', () => {
    render(<ul><PlantItem plant={mockUserPlant} /></ul>);
    const link = screen.getByRole('link', { name: 'Raised Bed 1' });
    expect(link).toHaveAttribute('href', '/gardens/garden-1/beds/bed-1');
  });

  it('renders a link to the garden detail page', () => {
    render(<ul><PlantItem plant={mockUserPlant} /></ul>);
    const link = screen.getByRole('link', { name: 'Front Yard' });
    expect(link).toHaveAttribute('href', '/gardens/garden-1');
  });

  it('renders the status badge', () => {
    render(<ul><PlantItem plant={mockUserPlant} /></ul>);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('growing');
  });

  it('opens the edit dialog when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<ul><PlantItem plant={mockUserPlant} /></ul>);

    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    expect(screen.getByRole('dialog', { name: /edit plant/i })).toBeInTheDocument();
  });

  it('opens the move dialog when Move to Bed is clicked', async () => {
    const user = userEvent.setup();
    render(<ul><PlantItem plant={mockUserPlant} /></ul>);

    await user.click(screen.getByRole('button', { name: /move to bed/i }));

    expect(screen.getByRole('dialog', { name: /move plant/i })).toBeInTheDocument();
  });

  it('deletes the plant when confirmed', async () => {
    const user = userEvent.setup();
    vi.mocked(mockConfirm).mockResolvedValueOnce(true);
    vi.mocked(deleteUserPlant).mockResolvedValueOnce(undefined);
    render(<ul><PlantItem plant={mockUserPlant} /></ul>);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() =>
      expect(deleteUserPlant).toHaveBeenCalledWith('garden-1', 'bed-1', 'plant-1'),
    );
  });

  it('does not delete the plant when confirm is cancelled', async () => {
    const user = userEvent.setup();
    vi.mocked(mockConfirm).mockResolvedValueOnce(false);
    render(<ul><PlantItem plant={mockUserPlant} /></ul>);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(deleteUserPlant).not.toHaveBeenCalled());
  });

  it('calls cloneUserPlant when Clone is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(cloneUserPlant).mockResolvedValueOnce(mockUserPlant);
    render(<ul><PlantItem plant={mockUserPlant} /></ul>);

    await user.click(screen.getByRole('button', { name: /clone/i }));

    await waitFor(() =>
      expect(cloneUserPlant).toHaveBeenCalledWith('garden-1', 'bed-1', 'plant-1'),
    );
  });

  it('includes the variety in the delete confirmation when present', async () => {
    const user = userEvent.setup();
    const plantWithVariety: UserPlant = { ...mockUserPlant, variety: 'Cherry' };
    vi.mocked(mockConfirm).mockResolvedValueOnce(false);
    render(<ul><PlantItem plant={plantWithVariety} /></ul>);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() =>
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ description: expect.stringContaining('Cherry') }),
      ),
    );
  });
});
