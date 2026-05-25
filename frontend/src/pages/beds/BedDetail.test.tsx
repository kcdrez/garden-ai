import { render, screen, waitFor } from '@/test/test-utils';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { fetchBeds } from '@/api/beds';
import { fetchUserPlants } from '@/api/plants';
import { mockUseParams } from '@/test/test-setup';
import { mockBed, mockUserPlant } from '@/test/fixtures';
import type { GardenBed } from '@/types/gardens';
import BedDetail from './BedDetail';

function renderWithCache(entries: Array<[unknown[], unknown]>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  for (const [key, data] of entries) {
    queryClient.setQueryData(key, data);
  }
  return rtlRender(<BedDetail />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  });
}

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

  it('shows an error message when the bed fails to load', async () => {
    vi.mocked(fetchBeds).mockRejectedValue(new Error('Network error'));
    render(<BedDetail />);

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  it('renders nothing when the bed is not found in the list', async () => {
    vi.mocked(fetchBeds).mockResolvedValue([]);
    render(<BedDetail />);

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    expect(screen.queryByText(/header:/i)).not.toBeInTheDocument();
  });

  it('uses cached beds and plants when the all-beds and all-plants caches are populated', async () => {
    renderWithCache([
      [['beds', 'all'], [mockBed]],
      [['plants', 'user', 'all'], [mockUserPlant]],
    ]);

    expect(await screen.findByText('Header: Raised Bed 1')).toBeInTheDocument();
  });
});
