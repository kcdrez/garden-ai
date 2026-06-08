import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchAllUserPlants } from '@/api/plants';
import { mockUserPlant } from '@/test/fixtures';
import type { UserPlant } from '@/types/plants';
import AllPlants from './AllPlants';

vi.mock('@/api/plants', () => ({ fetchAllUserPlants: vi.fn() }));

vi.mock('@/components/plants/PlantItem', () => ({
  default: ({ plant }: { plant: UserPlant }) => <li data-testid="plant-item">{plant.plantName}</li>,
}));

vi.mock('@/components/plants/dialogs/UserPlantDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Add Plant Dialog" /> : null,
}));

beforeEach(() => {
  vi.mocked(fetchAllUserPlants).mockClear();
});

describe('AllPlants', () => {
  it('shows empty message when user has no plants', async () => {
    vi.mocked(fetchAllUserPlants).mockResolvedValueOnce([]);
    render(<AllPlants />);

    await waitFor(() => expect(screen.getByText(/no plants yet/i)).toBeInTheDocument());
  });

  it('renders a list item per plant', async () => {
    vi.mocked(fetchAllUserPlants).mockResolvedValueOnce([
      mockUserPlant,
      { ...mockUserPlant, id: 'plant-2', plantName: 'Basil' },
    ]);
    render(<AllPlants />);

    await waitFor(() => expect(screen.getAllByTestId('plant-item')).toHaveLength(2));
  });

  it('opens the add plant dialog when Add Plant is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAllUserPlants).mockResolvedValueOnce([]);
    render(<AllPlants />);

    await user.click(screen.getByRole('button', { name: /add plant/i }));

    expect(screen.getByRole('dialog', { name: /add plant dialog/i })).toBeInTheDocument();
  });
});
