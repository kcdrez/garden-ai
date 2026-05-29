import { render, screen, waitFor } from '@/test/test-utils';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { fetchGarden } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import { mockUseParams } from '@/test/test-setup';
import { mockGarden, mockBed } from '@/test/fixtures';
import type { Garden, GardenBed } from '@/types/gardens';
import GardenDetail from './GardenDetail';

function renderWithCache(entries: Array<[unknown[], unknown]>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  for (const [key, data] of entries) {
    queryClient.setQueryData(key, data);
  }
  return rtlRender(<GardenDetail />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  });
}

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
  localStorage.clear();
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

  it('shows an error message when the garden fails to load', async () => {
    vi.mocked(fetchGarden).mockRejectedValue(new Error('Network error'));
    render(<GardenDetail />);

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  it('renders the garden layout section when the garden has dimensions', async () => {
    vi.mocked(fetchGarden).mockResolvedValue({ ...mockGarden, length: 10, width: 8 });
    render(<GardenDetail />);

    await screen.findByText('Header: Front Yard');
    expect(screen.getByText('Garden Grid')).toBeInTheDocument();
  });

  it('renders null when the garden is not found', async () => {
    vi.mocked(fetchGarden).mockResolvedValue(undefined as never);
    render(<GardenDetail />);

    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
    expect(screen.queryByText(/header:/i)).not.toBeInTheDocument();
  });

  it('renders the sort dropdown for the beds section', async () => {
    vi.mocked(fetchBeds).mockResolvedValue([mockBed]);
    render(<GardenDetail />);

    await screen.findByTestId('bed-item');
    expect(screen.getByRole('combobox', { name: /sort order/i })).toHaveValue('name-asc');
  });

  it('sorts beds alphabetically descending when name-desc is selected', async () => {
    const user = userEvent.setup();
    const bed2 = { ...mockBed, id: 'bed-2', name: 'Zzz Bed' };
    vi.mocked(fetchBeds).mockResolvedValue([bed2, mockBed]);
    render(<GardenDetail />);

    await waitFor(() => expect(screen.getAllByTestId('bed-item')).toHaveLength(2));
    const [first, second] = screen.getAllByTestId('bed-item');
    expect(first).toHaveTextContent('Raised Bed 1');
    expect(second).toHaveTextContent('Zzz Bed');

    await user.selectOptions(screen.getByRole('combobox', { name: /sort order/i }), 'name-desc');

    const [newFirst, newSecond] = screen.getAllByTestId('bed-item');
    expect(newFirst).toHaveTextContent('Zzz Bed');
    expect(newSecond).toHaveTextContent('Raised Bed 1');
  });

  it('uses cached garden and beds when the all-gardens and all-beds caches are populated', async () => {
    renderWithCache([
      [['gardens'], [mockGarden]],
      [['beds', 'all'], [mockBed]],
    ]);

    expect(await screen.findByText('Header: Front Yard')).toBeInTheDocument();
  });
});
