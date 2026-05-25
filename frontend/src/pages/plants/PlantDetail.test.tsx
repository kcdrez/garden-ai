import { render, screen, waitFor } from '@/test/test-utils';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { fetchUserPlant } from '@/api/plants';
import { mockUseParams } from '@/test/test-setup';
import { mockUserPlant } from '@/test/fixtures';
import type { UserPlant } from '@/types/plants';
import PlantDetail from './PlantDetail';

function renderWithCache(entries: Array<[unknown[], unknown]>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  for (const [key, data] of entries) {
    queryClient.setQueryData(key, data);
  }
  return rtlRender(<PlantDetail />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  });
}

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

  it('shows an error message when the plant fails to load', async () => {
    vi.mocked(fetchUserPlant).mockRejectedValue(new Error('Not found'));
    render(<PlantDetail />);

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });

  it('renders nothing when no plant is returned', async () => {
    vi.mocked(fetchUserPlant).mockResolvedValue(undefined as never);
    render(<PlantDetail />);

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    expect(screen.queryByText(/header:/i)).not.toBeInTheDocument();
  });

  it('uses cached plant when the all-plants cache is populated', async () => {
    renderWithCache([[['plants', 'user', 'all'], [mockUserPlant]]]);

    expect(await screen.findByText('Header: Tomato')).toBeInTheDocument();
  });
});
