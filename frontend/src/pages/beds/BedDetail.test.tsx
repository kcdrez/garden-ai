import { render, screen } from '@/test/test-utils';
import { fetchBeds } from '@/api/beds';
import { fetchUserPlants } from '@/api/plants';
import { mockUseParams } from '@/test/test-setup';
import { mockBed } from '@/test/fixtures';
import type { GardenBed } from '@/types/gardens';
import BedDetail from './BedDetail';

vi.mock('@/api/beds', () => ({ fetchBeds: vi.fn() }));
vi.mock('@/api/plants', () => ({ fetchUserPlants: vi.fn() }));

vi.mock('@/components/beds/BedDetailHeader', () => ({
  default: ({ bed }: { bed: GardenBed }) => <div>Header: {bed.name}</div>,
}));
vi.mock('@/components/beds/BedGrid', () => ({
  default: () => <div>Bed Grid</div>,
}));
vi.mock('@/components/plants/PlantListSection', () => ({
  default: () => <div>Plant List</div>,
}));

beforeEach(() => {
  mockUseParams.mockReturnValue({ id: 'garden-1', bedId: 'bed-1' });
  vi.mocked(fetchBeds).mockResolvedValue([mockBed]);
  vi.mocked(fetchUserPlants).mockResolvedValue([]);
});

describe('BedDetail', () => {
  it('shows a loading indicator while the bed loads', () => {
    vi.mocked(fetchBeds).mockImplementation(() => new Promise(() => {}));
    render(<BedDetail />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the bed header with the loaded bed', async () => {
    render(<BedDetail />);

    expect(await screen.findByText('Header: Raised Bed 1')).toBeInTheDocument();
  });

  it('renders the layout grid and plant list', async () => {
    render(<BedDetail />);

    await screen.findByText('Header: Raised Bed 1');
    expect(screen.getByText('Bed Grid')).toBeInTheDocument();
    expect(screen.getByText('Plant List')).toBeInTheDocument();
  });
});
