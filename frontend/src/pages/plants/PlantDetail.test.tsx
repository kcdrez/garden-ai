import { render, screen } from '@/test/test-utils';
import { fetchUserPlant } from '@/api/plants';
import { mockUseParams } from '@/test/test-setup';
import { mockUserPlant } from '@/test/fixtures';
import type { UserPlant } from '@/types/plants';
import PlantDetail from './PlantDetail';

vi.mock('@/api/plants', () => ({ fetchUserPlant: vi.fn() }));

vi.mock('@/components/plants/PlantDetailHeader', () => ({
  default: ({ plant }: { plant: UserPlant }) => <div>Header: {plant.plantName}</div>,
}));
vi.mock('@/components/plants/PlantTimeline', () => ({
  default: () => <div>Plant Timeline</div>,
}));

beforeEach(() => {
  mockUseParams.mockReturnValue({ plantId: 'plant-1' });
  vi.mocked(fetchUserPlant).mockResolvedValue(mockUserPlant);
});

describe('PlantDetail', () => {
  it('shows a loading indicator while the plant loads', () => {
    vi.mocked(fetchUserPlant).mockImplementation(() => new Promise(() => {}));
    render(<PlantDetail />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the plant header with the loaded plant', async () => {
    render(<PlantDetail />);

    expect(await screen.findByText('Header: Tomato')).toBeInTheDocument();
  });

  it('renders the timeline', async () => {
    render(<PlantDetail />);

    await screen.findByText('Header: Tomato');
    expect(screen.getByText('Plant Timeline')).toBeInTheDocument();
  });
});
