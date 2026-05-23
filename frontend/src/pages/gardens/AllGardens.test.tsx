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

  it('opens the add garden dialog when Add Garden is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGardens).mockResolvedValueOnce([]);
    render(<AllGardens />);

    await user.click(screen.getByRole('button', { name: /add garden/i }));

    expect(screen.getByRole('dialog', { name: /add garden dialog/i })).toBeInTheDocument();
  });
});
