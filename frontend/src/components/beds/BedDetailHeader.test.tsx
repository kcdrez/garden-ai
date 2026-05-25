import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { deleteBed } from '@/api/beds';
import { mockNavigate } from '@/test/test-setup';
import { mockBed } from '@/test/fixtures';
import type { GardenBed } from '@/types/gardens';
import BedDetailHeader from './BedDetailHeader';

vi.mock('@/api/beds', () => ({ deleteBed: vi.fn() }));

vi.mock('@/components/beds/BedEditForm', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Edit Bed Form" /> : null,
}));
vi.mock('@/components/beds/BedDetails', () => ({
  default: ({ bed }: { bed: GardenBed }) => <div>Bed Details: {bed.soilType}</div>,
}));

const mockConfirm = vi.fn();
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  vi.mocked(deleteBed).mockResolvedValue(undefined);
  mockConfirm.mockResolvedValue(true);
});

describe('BedDetailHeader', () => {
  it('renders the bed name and dimensions', () => {
    render(<BedDetailHeader bed={mockBed} />);

    expect(screen.getByRole('heading', { name: 'Raised Bed 1' })).toBeInTheDocument();
    expect(screen.getByText('4 × 4 ft')).toBeInTheDocument();
  });

  it('renders a back link to the parent garden', () => {
    render(<BedDetailHeader bed={mockBed} />);

    expect(screen.getByRole('link', { name: /front yard/i })).toBeInTheDocument();
  });

  it('does not show the details card when bed has no optional fields', () => {
    render(<BedDetailHeader bed={mockBed} />);

    expect(screen.queryByText(/bed details/i)).not.toBeInTheDocument();
  });

  it('shows the details card when bed has optional fields', () => {
    const bedWithDetails = { ...mockBed, soilType: 'loamy' };
    render(<BedDetailHeader bed={bedWithDetails} />);

    expect(screen.getByText('Bed Details: loamy')).toBeInTheDocument();
  });

  it('opens the edit form when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<BedDetailHeader bed={mockBed} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('dialog', { name: /edit bed form/i })).toBeInTheDocument();
  });

  it('calls deleteBed after confirming delete', async () => {
    const user = userEvent.setup();
    render(<BedDetailHeader bed={mockBed} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(deleteBed).toHaveBeenCalledWith('garden-1', 'bed-1'));
  });

  it('does not delete when confirm is cancelled', async () => {
    mockConfirm.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<BedDetailHeader bed={mockBed} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(deleteBed).not.toHaveBeenCalled();
  });

  it('navigates back to the garden after successful delete', async () => {
    const user = userEvent.setup();
    render(<BedDetailHeader bed={mockBed} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/gardens/garden-1'));
  });
});
