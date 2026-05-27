import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchPlants, createUserPlant, updateUserPlant } from '@/api/plants';
import { fetchGardens } from '@/api/gardens';
import { mockUserPlant, mockGarden } from '@/test/fixtures';
import type { Plant } from '@/types/plants';
import type * as RHF from 'react-hook-form';
import UserPlantDialog from './UserPlantDialog';

vi.mock('@/api/plants', () => ({
  fetchPlants: vi.fn(),
  createUserPlant: vi.fn(),
  updateUserPlant: vi.fn(),
}));
vi.mock('@/api/gardens', () => ({
  fetchGardens: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/api/beds', () => ({ fetchBeds: vi.fn().mockResolvedValue([]) }));

vi.mock('@/components/plants/PlantPicker', async () => {
  const { useController } =
    await vi.importActual<typeof RHF>('react-hook-form');

  function MockPlantPicker({
    plants,
    control,
    name,
  }: {
    plants: Plant[];
    control: RHF.Control;
    name: string;
  }) {
    const { field } = useController({ control, name });
    return (
      <div>
        {plants.map((p) => (
          <button key={p.id} type="button" onClick={() => field.onChange(p.id)}>
            {p.commonName}
          </button>
        ))}
      </div>
    );
  }

  return { default: MockPlantPicker };
});

const onOpenChange = vi.fn();

const catalogPlant: Plant = {
  id: 'catalog-1',
  commonName: 'Tomato',
  category: 'vegetable',
  scientificName: '',
  description: '',
};

beforeEach(() => {
  vi.mocked(fetchPlants).mockResolvedValue([catalogPlant]);
  vi.mocked(createUserPlant).mockResolvedValue([mockUserPlant]);
  vi.mocked(updateUserPlant).mockResolvedValue(mockUserPlant);
});

describe('UserPlantDialog', () => {
  it('shows the Add Plant submit button in create mode', async () => {
    render(
      <UserPlantDialog
        gardenId="garden-1"
        bedId="bed-1"
        open
        onOpenChange={onOpenChange}
      />,
    );
    await screen.findByRole('button', { name: /tomato/i });
    expect(
      screen.getByRole('button', { name: /add plant/i }),
    ).toBeInTheDocument();
  });

  it('shows "Edit Plant" title in edit mode', () => {
    render(
      <UserPlantDialog
        gardenId="garden-1"
        bedId="bed-1"
        userPlant={mockUserPlant}
        open
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.getByText('Edit Plant')).toBeInTheDocument();
  });

  it('submit is disabled until a plant is selected', async () => {
    render(
      <UserPlantDialog
        gardenId="garden-1"
        bedId="bed-1"
        open
        onOpenChange={onOpenChange}
      />,
    );
    await screen.findByRole('button', { name: /tomato/i });
    expect(screen.getByRole('button', { name: /add plant/i })).toBeDisabled();
  });

  it('enables submit after selecting a plant', async () => {
    const user = userEvent.setup();
    render(
      <UserPlantDialog
        gardenId="garden-1"
        bedId="bed-1"
        open
        onOpenChange={onOpenChange}
      />,
    );

    await user.click(await screen.findByRole('button', { name: /tomato/i }));

    expect(
      screen.getByRole('button', { name: /add plant/i }),
    ).not.toBeDisabled();
  });

  it('calls createUserPlant on submit in create mode', async () => {
    const user = userEvent.setup();
    render(
      <UserPlantDialog
        gardenId="garden-1"
        bedId="bed-1"
        open
        onOpenChange={onOpenChange}
      />,
    );

    await user.click(await screen.findByRole('button', { name: /tomato/i }));
    await user.click(screen.getByRole('button', { name: /add plant/i }));

    await waitFor(() =>
      expect(createUserPlant).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        expect.objectContaining({ plant: 'catalog-1' }),
      ),
    );
  });

  it('calls updateUserPlant on submit in edit mode', async () => {
    const user = userEvent.setup();
    render(
      <UserPlantDialog
        gardenId="garden-1"
        bedId="bed-1"
        userPlant={mockUserPlant}
        open
        onOpenChange={onOpenChange}
      />,
    );

    await screen.findByRole('button', { name: /tomato/i });
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(updateUserPlant).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        'plant-1',
        expect.objectContaining({ plant: 'catalog-1' }),
      ),
    );
  });

  it('calls onOpenChange(false) after a successful submit', async () => {
    const user = userEvent.setup();
    render(
      <UserPlantDialog
        gardenId="garden-1"
        bedId="bed-1"
        userPlant={mockUserPlant}
        open
        onOpenChange={onOpenChange}
      />,
    );

    await screen.findByRole('button', { name: /tomato/i });
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('renders garden and bed pickers when neither gardenId nor bedId is provided', async () => {
    render(<UserPlantDialog open onOpenChange={onOpenChange} />);

    await screen.findByRole('button', { name: /tomato/i });

    expect(screen.getByRole('combobox', { name: /garden/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /bed/i })).toBeInTheDocument();
  });

  it('enables the bed picker once a garden is selected', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGardens).mockResolvedValueOnce([mockGarden]);
    render(<UserPlantDialog open onOpenChange={onOpenChange} />);

    await screen.findByRole('button', { name: /tomato/i });

    const bedSelect = screen.getByRole('combobox', { name: /bed/i });
    expect(bedSelect.parentElement?.parentElement).toHaveClass('opacity-50');

    await user.selectOptions(screen.getByRole('combobox', { name: /garden/i }), 'garden-1');

    expect(bedSelect.parentElement?.parentElement).not.toHaveClass('opacity-50');
  });
});
