import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchAllBeds } from '@/api/beds';
import { mockBeds } from '@/test/fixtures';
import type { GardenBed } from '@/types/gardens';
import AllBeds from './AllBeds';

vi.mock('@/api/beds', () => ({ fetchAllBeds: vi.fn() }));

vi.mock('@/components/beds/BedItem', () => ({
  default: ({ bed }: { bed: GardenBed }) => <div data-testid="bed-item">{bed.name}</div>,
}));

vi.mock('@/components/beds/BedDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Add Bed Dialog" /> : null,
}));

beforeEach(() => {
  vi.mocked(fetchAllBeds).mockClear();
});

describe('AllBeds', () => {
  it('shows empty message when user has no beds', async () => {
    vi.mocked(fetchAllBeds).mockResolvedValueOnce([]);
    render(<AllBeds />);

    await waitFor(() =>
      expect(screen.getByText(/no beds yet/i)).toBeInTheDocument()
    );
  });

  it('renders a section heading per garden with the correct bed items', async () => {
    vi.mocked(fetchAllBeds).mockResolvedValueOnce(mockBeds);
    render(<AllBeds />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Front Yard' })).toBeInTheDocument()
    );

    expect(screen.getByRole('heading', { name: 'Back Yard' })).toBeInTheDocument();
    expect(screen.getAllByTestId('bed-item')).toHaveLength(3);
  });

  it('opens the add bed dialog when Add Bed is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAllBeds).mockResolvedValueOnce([]);
    render(<AllBeds />);

    await user.click(screen.getByRole('button', { name: /add bed/i }));

    expect(screen.getByRole('dialog', { name: /add bed dialog/i })).toBeInTheDocument();
  });
});
