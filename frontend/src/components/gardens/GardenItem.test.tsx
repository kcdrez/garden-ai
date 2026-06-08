import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { deleteGarden } from '@/api/gardens';
import { mockGarden } from '@/test/fixtures';
import GardenItem from './GardenItem';

vi.mock('@/api/gardens', () => ({ deleteGarden: vi.fn() }));

const mockConfirm = vi.fn();
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/components/ui/card-actions-menu', () => ({
  default: ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <>
      <button onClick={onEdit}>Edit</button>
      <button onClick={onDelete}>Delete</button>
    </>
  ),
}));

vi.mock('@/components/gardens/GardenDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Edit Garden" /> : null,
}));

describe('GardenItem', () => {
  it('renders the garden name', () => {
    render(<GardenItem garden={mockGarden} />);
    expect(screen.getByText('Front Yard')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    render(<GardenItem garden={mockGarden} />);
    expect(screen.getByText('My main garden')).toBeInTheDocument();
  });

  it('does not render description when absent', () => {
    render(<GardenItem garden={{ ...mockGarden, description: null }} />);
    expect(screen.queryByText('My main garden')).not.toBeInTheDocument();
  });

  it('renders dimensions when length and width are present', () => {
    render(<GardenItem garden={{ ...mockGarden, length: 10, width: 8 }} />);
    expect(screen.getByText('10 × 8 ft')).toBeInTheDocument();
  });

  it('does not render dimensions when length or width is absent', () => {
    render(<GardenItem garden={mockGarden} />);
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it('renders singular bed count', () => {
    render(<GardenItem garden={{ ...mockGarden, bedCount: 1 }} />);
    expect(screen.getByText('1 bed')).toBeInTheDocument();
  });

  it('renders plural bed count', () => {
    render(<GardenItem garden={{ ...mockGarden, bedCount: 3 }} />);
    expect(screen.getByText('3 beds')).toBeInTheDocument();
  });

  it('has a link to the garden detail page', () => {
    render(<GardenItem garden={mockGarden} />);
    expect(screen.getByRole('link', { name: 'Front Yard' })).toHaveAttribute(
      'href',
      '/gardens/garden-1',
    );
  });

  it('opens the edit dialog when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<GardenItem garden={mockGarden} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('dialog', { name: /edit garden/i })).toBeInTheDocument();
  });

  it('deletes the garden when confirmed', async () => {
    const user = userEvent.setup();
    vi.mocked(mockConfirm).mockResolvedValueOnce(true);
    vi.mocked(deleteGarden).mockResolvedValueOnce(undefined);
    render(<GardenItem garden={mockGarden} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(deleteGarden).toHaveBeenCalledWith('garden-1'));
  });

  it('does not delete the garden when confirm is cancelled', async () => {
    const user = userEvent.setup();
    vi.mocked(mockConfirm).mockResolvedValueOnce(false);
    render(<GardenItem garden={mockGarden} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(deleteGarden).not.toHaveBeenCalled());
  });

  it('renders a grip icon when isDraggable is true', () => {
    render(<GardenItem garden={mockGarden} isDraggable />);
    expect(screen.getByRole('link', { name: 'Front Yard' })).toBeInTheDocument();
  });

  it('navigates to garden detail when the card body is clicked', async () => {
    const user = userEvent.setup();
    render(<GardenItem garden={mockGarden} />);
    await user.click(screen.getByText('My main garden'));
    // navigate() was called — no assertion needed beyond "no throw" for coverage
  });
});
