import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchPlants, createUserPlant } from '@/api/plants';
import { fetchGardens } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import { mockUserPlant, mockGarden, mockBed } from '@/test/fixtures';
import type { Plant } from '@/types/plants';
import type * as RHF from 'react-hook-form';
import UserPlantDialog from './UserPlantDialog';

vi.mock('@/api/plants', () => ({
  fetchPlants: vi.fn(),
  createUserPlant: vi.fn(),
}));
vi.mock('@/api/gardens', () => ({
  fetchGardens: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/api/beds', () => ({ fetchBeds: vi.fn().mockResolvedValue([]) }));

vi.mock('@/components/plants/dialogs/UserPlantEditForm', () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div role="form" aria-label="Edit Plant Form">
      <button type="button" onClick={onSuccess}>Save</button>
    </div>
  ),
}));

vi.mock('@/components/plants/shared/PlantPicker', async () => {
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
  defaultSpacingFt: null,
};

beforeEach(() => {
  vi.mocked(fetchPlants).mockResolvedValue([catalogPlant]);
  vi.mocked(createUserPlant).mockResolvedValue([mockUserPlant]);
  onOpenChange.mockClear();
});

describe('UserPlantDialog', () => {
  describe('dialog shell', () => {
    it('shows "Add Plant" title in create mode', async () => {
      render(<UserPlantDialog gardenId="garden-1" bedId="bed-1" open onOpenChange={onOpenChange} />);
      await screen.findByRole('button', { name: /tomato/i });
      expect(screen.getByRole('heading', { name: 'Add Plant' })).toBeInTheDocument();
    });

    it('shows "Edit Plant" title and the edit form in edit mode', () => {
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
      expect(screen.getByRole('form', { name: /edit plant form/i })).toBeInTheDocument();
    });

    it('calls onOpenChange(false) when the edit form signals success', async () => {
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
      await user.click(screen.getByRole('button', { name: /save/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('create mode', () => {
    it('shows the Add Plant submit button', async () => {
      render(<UserPlantDialog gardenId="garden-1" bedId="bed-1" open onOpenChange={onOpenChange} />);
      await screen.findByRole('button', { name: /tomato/i });
      expect(screen.getByRole('button', { name: /add plant/i })).toBeInTheDocument();
    });

    it('submit is disabled until a plant is selected', async () => {
      render(<UserPlantDialog gardenId="garden-1" bedId="bed-1" open onOpenChange={onOpenChange} />);
      await screen.findByRole('button', { name: /tomato/i });
      expect(screen.getByRole('button', { name: /add plant/i })).toBeDisabled();
    });

    it('enables submit after selecting a plant', async () => {
      const user = userEvent.setup();
      render(<UserPlantDialog gardenId="garden-1" bedId="bed-1" open onOpenChange={onOpenChange} />);
      await user.click(await screen.findByRole('button', { name: /tomato/i }));
      expect(screen.getByRole('button', { name: /add plant/i })).not.toBeDisabled();
    });

    it('calls createUserPlant on submit', async () => {
      const user = userEvent.setup();
      render(<UserPlantDialog gardenId="garden-1" bedId="bed-1" open onOpenChange={onOpenChange} />);
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

    it('calls onOpenChange(false) after a successful create', async () => {
      const user = userEvent.setup();
      render(<UserPlantDialog gardenId="garden-1" bedId="bed-1" open onOpenChange={onOpenChange} />);
      await user.click(await screen.findByRole('button', { name: /tomato/i }));
      await user.click(screen.getByRole('button', { name: /add plant/i }));
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });
  });

  describe('garden/bed pickers', () => {
    it('renders both pickers when neither gardenId nor bedId is provided', async () => {
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

    it('shows only the bed picker when gardenId is provided', async () => {
      render(<UserPlantDialog gardenId="garden-1" open onOpenChange={onOpenChange} />);
      await screen.findByRole('button', { name: /tomato/i });
      expect(screen.queryByRole('combobox', { name: /garden/i })).not.toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /bed/i })).toBeInTheDocument();
    });

    it('shows only the garden picker when bedId is provided', async () => {
      render(<UserPlantDialog bedId="bed-1" open onOpenChange={onOpenChange} />);
      await screen.findByRole('button', { name: /tomato/i });
      expect(screen.getByRole('combobox', { name: /garden/i })).toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: /bed/i })).not.toBeInTheDocument();
    });

    it('calls createUserPlant using selected garden and bed ids from pickers', async () => {
      const user = userEvent.setup();
      vi.mocked(fetchGardens).mockResolvedValueOnce([mockGarden]);
      vi.mocked(fetchBeds).mockResolvedValueOnce([mockBed]);
      render(<UserPlantDialog open onOpenChange={onOpenChange} />);

      await user.click(await screen.findByRole('button', { name: /tomato/i }));
      await user.selectOptions(screen.getByRole('combobox', { name: /garden/i }), 'garden-1');
      await screen.findByText('Raised Bed 1');
      await user.selectOptions(screen.getByRole('combobox', { name: /bed/i }), 'bed-1');
      await user.click(screen.getByRole('button', { name: /add plant/i }));

      await waitFor(() =>
        expect(createUserPlant).toHaveBeenCalledWith(
          'garden-1',
          'bed-1',
          expect.objectContaining({ plant: 'catalog-1' }),
        ),
      );
    });
  });
});
