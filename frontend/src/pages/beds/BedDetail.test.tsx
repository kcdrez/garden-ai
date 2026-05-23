import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchBeds, deleteBed } from '@/api/beds';
import { fetchUserPlants } from '@/api/plants';
import { mockNavigate, mockUseParams } from '@/test/test-setup';
import { mockBed } from '@/test/fixtures';
import type { GardenBed } from '@/types/gardens';
import BedDetail from './BedDetail';

vi.mock('@/api/beds', () => ({ fetchBeds: vi.fn(), deleteBed: vi.fn() }));
vi.mock('@/api/plants', () => ({ fetchUserPlants: vi.fn() }));

vi.mock('@/components/beds/BedGrid', () => ({
  default: () => <div>Bed Grid</div>,
}));
vi.mock('@/components/plants/PlantListSection', () => ({
  default: () => <div>Plant List</div>,
}));
vi.mock('@/components/beds/BedDetails', () => ({
  default: ({ bed }: { bed: GardenBed }) => <div>Bed Details: {bed.name}</div>,
}));
vi.mock('@/components/beds/BedDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Edit Bed Dialog" /> : null,
}));

beforeEach(() => {
  mockUseParams.mockReturnValue({ id: 'garden-1', bedId: 'bed-1' });
  vi.mocked(fetchBeds).mockResolvedValue([mockBed]);
  vi.mocked(fetchUserPlants).mockResolvedValue([]);
  vi.mocked(deleteBed).mockResolvedValue(undefined);
});

describe('BedDetail', () => {
  it('shows a loading indicator while the bed loads', () => {
    vi.mocked(fetchBeds).mockImplementation(() => new Promise(() => {}));
    render(<BedDetail />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the bed name and dimensions', async () => {
    render(<BedDetail />);

    expect(await screen.findByRole('heading', { name: 'Raised Bed 1' })).toBeInTheDocument();
    expect(screen.getByText('4 × 4 ft')).toBeInTheDocument();
  });

  it('opens the edit dialog when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<BedDetail />);

    await waitFor(() => screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('dialog', { name: /edit bed dialog/i })).toBeInTheDocument();
  });

  it('calls deleteBed when Delete is clicked', async () => {
    const user = userEvent.setup();
    render(<BedDetail />);

    await waitFor(() => screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(deleteBed).toHaveBeenCalledWith('garden-1', 'bed-1');
  });

  it('navigates back to the garden after successful delete', async () => {
    const user = userEvent.setup();
    render(<BedDetail />);

    await waitFor(() => screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/gardens/garden-1'));
  });
});
