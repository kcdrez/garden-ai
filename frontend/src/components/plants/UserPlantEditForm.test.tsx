import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchPlants, updateUserPlant } from '@/api/plants';
import { mockUserPlant } from '@/test/fixtures';
import type { Plant } from '@/types/plants';
import type * as RHF from 'react-hook-form';
import UserPlantEditForm from './UserPlantEditForm';

vi.mock('@/api/plants', () => ({
  fetchPlants: vi.fn(),
  updateUserPlant: vi.fn(),
}));

vi.mock('@/components/plants/PlantPicker', async () => {
  const { useController } = await vi.importActual<typeof RHF>('react-hook-form');

  function MockPlantPicker({ plants, control, name }: { plants: Plant[]; control: RHF.Control; name: string }) {
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

const onSuccess = vi.fn();

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
  vi.mocked(updateUserPlant).mockResolvedValue(mockUserPlant);
  onSuccess.mockClear();
});

describe('UserPlantEditForm', () => {
  it('renders the catalog plant picker and form fields', async () => {
    render(<UserPlantEditForm open userPlant={mockUserPlant} onSuccess={onSuccess} />);

    expect(await screen.findByRole('button', { name: /tomato/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/variety/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('renders the Save button', async () => {
    render(<UserPlantEditForm open userPlant={mockUserPlant} onSuccess={onSuccess} />);
    await screen.findByRole('button', { name: /tomato/i });
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('calls updateUserPlant with the correct arguments on submit', async () => {
    const user = userEvent.setup();
    render(<UserPlantEditForm open userPlant={mockUserPlant} onSuccess={onSuccess} />);

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

  it('calls onSuccess after a successful save', async () => {
    const user = userEvent.setup();
    render(<UserPlantEditForm open userPlant={mockUserPlant} onSuccess={onSuccess} />);

    await screen.findByRole('button', { name: /tomato/i });
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('shows "Saving…" while the mutation is in flight', async () => {
    const user = userEvent.setup();
    vi.mocked(updateUserPlant).mockImplementation(() => new Promise(() => {}));
    render(<UserPlantEditForm open userPlant={mockUserPlant} onSuccess={onSuccess} />);

    await screen.findByRole('button', { name: /tomato/i });
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(screen.getByText('Saving…')).toBeInTheDocument());
  });

  it('pre-populates fields from the userPlant', async () => {
    const plant = {
      ...mockUserPlant,
      variety: 'Cherry',
      notes: 'Planted by the fence',
      startDate: '2024-03-01',
      status: 'growing' as const,
    };
    render(<UserPlantEditForm open userPlant={plant} onSuccess={onSuccess} />);

    await screen.findByRole('button', { name: /tomato/i });
    expect(screen.getByLabelText(/variety/i)).toHaveValue('Cherry');
    expect(screen.getByLabelText(/notes/i)).toHaveValue('Planted by the fence');
    expect(screen.getByLabelText(/start date/i)).toHaveValue('2024-03-01');
    expect(screen.getByLabelText(/status/i)).toHaveValue('growing');
  });
});
