import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchPlants } from '@/api/plants';
import type { Plant } from '@/types/plants';
import type * as RHF from 'react-hook-form';
import UserPlantForm from './UserPlantForm';

vi.mock('@/api/plants', () => ({ fetchPlants: vi.fn() }));

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

const catalogPlant: Plant = {
  id: 'catalog-1',
  commonName: 'Tomato',
  category: 'vegetable',
  scientificName: '',
  description: '',
};

const onSubmit = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.mocked(fetchPlants).mockResolvedValue([catalogPlant]);
});

function renderForm(props: Partial<React.ComponentProps<typeof UserPlantForm>> = {}) {
  return render(
    <UserPlantForm
      open
      submitLabel="Save"
      isPending={false}
      onSubmit={onSubmit}
      {...props}
    />,
  );
}

describe('UserPlantForm', () => {
  it('renders the submit button with the provided label', async () => {
    renderForm({ submitLabel: 'Add Plant' });
    await screen.findByRole('button', { name: /tomato/i });
    expect(screen.getByRole('button', { name: /add plant/i })).toBeInTheDocument();
  });

  it('submit is disabled until a plant is selected', async () => {
    renderForm();
    await screen.findByRole('button', { name: /tomato/i });
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('enables submit after selecting a plant', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(await screen.findByRole('button', { name: /tomato/i }));

    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
  });

  it('calls onSubmit with the selected plant when submitted', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(await screen.findByRole('button', { name: /tomato/i }));
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ plant: 'catalog-1' }),
      ),
    );
  });

  it('hides the quantity field by default', async () => {
    renderForm();
    await screen.findByRole('button', { name: /tomato/i });
    expect(screen.queryByLabelText(/quantity/i)).not.toBeInTheDocument();
  });

  it('shows the quantity field when showQuantity is true', async () => {
    renderForm({ showQuantity: true });
    await screen.findByRole('button', { name: /tomato/i });
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
  });

  it('renders children above the plant picker', async () => {
    renderForm({ children: <div>Extra content</div> });
    await screen.findByRole('button', { name: /tomato/i });
    expect(screen.getByText('Extra content')).toBeInTheDocument();
  });

  it('keeps submit disabled when the disabled prop is true', async () => {
    const user = userEvent.setup();
    renderForm({ disabled: true });

    await user.click(await screen.findByRole('button', { name: /tomato/i }));

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('shows a pending label while isPending is true', async () => {
    renderForm({ isPending: true });
    await screen.findByRole('button', { name: /tomato/i });
    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
  });
});
