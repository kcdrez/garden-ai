import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { deleteBed } from '@/api/beds';
import { mockBed } from '@/test/fixtures';
import type { GardenBed } from '@/types/gardens';
import BedItem from './BedItem';

vi.mock('@/api/beds', () => ({ deleteBed: vi.fn() }));

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

vi.mock('@/components/beds/BedDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Edit Bed" /> : null,
}));

vi.mock('@/components/beds/BedDetails', () => ({
  default: ({ bed }: { bed: GardenBed }) => <div data-testid="bed-details">{bed.name}</div>,
}));

describe('BedItem', () => {
  it('renders the bed name', () => {
    render(<BedItem gardenId="garden-1" bed={mockBed} />);
    expect(screen.getByText('Raised Bed 1')).toBeInTheDocument();
  });

  it('renders formatted dimensions', () => {
    render(<BedItem gardenId="garden-1" bed={mockBed} />);
    expect(screen.getByText('4 × 4 ft')).toBeInTheDocument();
  });

  it('renders singular plant count', () => {
    render(<BedItem gardenId="garden-1" bed={{ ...mockBed, plantCount: 1 }} />);
    expect(screen.getByText('1 plant')).toBeInTheDocument();
  });

  it('renders plural plant count', () => {
    render(<BedItem gardenId="garden-1" bed={{ ...mockBed, plantCount: 3 }} />);
    expect(screen.getByText('3 plants')).toBeInTheDocument();
  });

  it('renders BedDetails when the bed has details', () => {
    const bedWithDetails: GardenBed = { ...mockBed, facing: 'N' };
    render(<BedItem gardenId="garden-1" bed={bedWithDetails} />);
    expect(screen.getByTestId('bed-details')).toBeInTheDocument();
  });

  it('does not render BedDetails when the bed has no details', () => {
    render(<BedItem gardenId="garden-1" bed={mockBed} />);
    expect(screen.queryByTestId('bed-details')).not.toBeInTheDocument();
  });

  it('has a link to the bed detail page', () => {
    render(<BedItem gardenId="garden-1" bed={mockBed} />);
    expect(screen.getByRole('link', { name: 'Raised Bed 1' })).toHaveAttribute(
      'href',
      '/gardens/garden-1/beds/bed-1',
    );
  });

  it('opens the edit dialog when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<BedItem gardenId="garden-1" bed={mockBed} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('dialog', { name: /edit bed/i })).toBeInTheDocument();
  });

  it('deletes the bed when confirmed', async () => {
    const user = userEvent.setup();
    vi.mocked(mockConfirm).mockResolvedValueOnce(true);
    vi.mocked(deleteBed).mockResolvedValueOnce(undefined);
    render(<BedItem gardenId="garden-1" bed={mockBed} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(deleteBed).toHaveBeenCalledWith('garden-1', 'bed-1'));
  });

  it('does not delete the bed when confirm is cancelled', async () => {
    const user = userEvent.setup();
    vi.mocked(mockConfirm).mockResolvedValueOnce(false);
    render(<BedItem gardenId="garden-1" bed={mockBed} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(deleteBed).not.toHaveBeenCalled());
  });
});
