import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchGarden } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import { mockUseParams } from '@/test/test-setup';
import { mockGarden, mockBed } from '@/test/fixtures';
import type { Garden, GardenBed } from '@/types/gardens';
import GardenDetail from './GardenDetail';

vi.mock('@/api/gardens', () => ({ fetchGarden: vi.fn() }));
vi.mock('@/api/beds', () => ({ fetchBeds: vi.fn() }));

vi.mock('@/components/gardens/GardenDetailHeader', () => ({
  default: ({ garden }: { garden: Garden }) => <div>Header: {garden.name}</div>,
}));
vi.mock('@/components/beds/BedItem', () => ({
  default: ({ bed }: { bed: GardenBed }) => <div data-testid="bed-item">{bed.name}</div>,
}));
vi.mock('@/components/beds/BedDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Add Bed Dialog" /> : null,
}));
vi.mock('@/components/gardens/GardenGrid', () => ({
  default: () => <div>Garden Grid</div>,
}));

beforeEach(() => {
  mockUseParams.mockReturnValue({ id: 'garden-1' });
  vi.mocked(fetchGarden).mockResolvedValue(mockGarden);
  vi.mocked(fetchBeds).mockResolvedValue([]);
});

describe('GardenDetail', () => {
  it('shows a loading indicator while the garden loads', () => {
    vi.mocked(fetchGarden).mockImplementation(() => new Promise(() => {}));
    render(<GardenDetail />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the garden header with the loaded garden', async () => {
    render(<GardenDetail />);

    expect(await screen.findByText('Header: Front Yard')).toBeInTheDocument();
  });

  it('renders bed items when beds exist', async () => {
    vi.mocked(fetchBeds).mockResolvedValue([mockBed]);
    render(<GardenDetail />);

    await waitFor(() => expect(screen.getAllByTestId('bed-item')).toHaveLength(1));
    expect(screen.getByText('Raised Bed 1')).toBeInTheDocument();
  });

  it('opens the add bed dialog when Add Bed is clicked', async () => {
    const user = userEvent.setup();
    render(<GardenDetail />);

    await screen.findByText('Header: Front Yard');
    await user.click(screen.getByRole('button', { name: /add bed/i }));

    expect(screen.getByRole('dialog', { name: /add bed dialog/i })).toBeInTheDocument();
  });
});
