import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchGardens } from '@/api/gardens';
import { mockGarden } from '@/test/fixtures';
import type { Garden } from '@/types/gardens';
import AllGardens from './AllGardens';

vi.mock('@/api/gardens', () => ({ fetchGardens: vi.fn() }));

vi.mock('@/components/gardens/GardenItem', () => ({
  default: ({ garden }: { garden: Garden }) => <div data-testid="garden-item">{garden.name}</div>,
}));

vi.mock('@/components/gardens/GardenDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Add Garden Dialog" /> : null,
}));

beforeEach(() => {
  vi.mocked(fetchGardens).mockClear();
  localStorage.clear();
});

describe('AllGardens', () => {
  it('shows empty message when user has no gardens', async () => {
    vi.mocked(fetchGardens).mockResolvedValueOnce([]);
    render(<AllGardens />);

    await waitFor(() => expect(screen.getByText(/no gardens yet/i)).toBeInTheDocument());
  });

  it('renders a card per garden', async () => {
    vi.mocked(fetchGardens).mockResolvedValueOnce([
      mockGarden,
      { ...mockGarden, id: 'garden-2', name: 'Back Yard' },
    ]);
    render(<AllGardens />);

    await waitFor(() => expect(screen.getAllByTestId('garden-item')).toHaveLength(2));
    expect(screen.getByText('Front Yard')).toBeInTheDocument();
    expect(screen.getByText('Back Yard')).toBeInTheDocument();
  });

  it('renders the sort dropdown with the default name-asc selection', async () => {
    vi.mocked(fetchGardens).mockResolvedValueOnce([mockGarden]);
    render(<AllGardens />);

    await screen.findByTestId('garden-item');
    expect(screen.getByRole('combobox', { name: /sort order/i })).toHaveValue('name-asc');
  });

  it('sorts gardens alphabetically descending when name-desc is selected', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGardens).mockResolvedValueOnce([
      mockGarden,
      { ...mockGarden, id: 'garden-2', name: 'Back Yard' },
    ]);
    render(<AllGardens />);

    await waitFor(() => expect(screen.getAllByTestId('garden-item')).toHaveLength(2));
    const [first, second] = screen.getAllByTestId('garden-item');
    expect(first).toHaveTextContent('Back Yard');
    expect(second).toHaveTextContent('Front Yard');

    await user.selectOptions(screen.getByRole('combobox', { name: /sort order/i }), 'name-desc');

    const [newFirst, newSecond] = screen.getAllByTestId('garden-item');
    expect(newFirst).toHaveTextContent('Front Yard');
    expect(newSecond).toHaveTextContent('Back Yard');
  });

  it('opens the add garden dialog when Add Garden is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGardens).mockResolvedValueOnce([]);
    render(<AllGardens />);

    await user.click(screen.getByRole('button', { name: /add garden/i }));

    expect(screen.getByRole('dialog', { name: /add garden dialog/i })).toBeInTheDocument();
  });
});
