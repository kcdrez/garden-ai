import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { mockUserPlant } from '@/test/fixtures';
import PlacePlantDialog from './PlacePlantDialog';

vi.mock('@/components/plants/UserPlantForm', () => ({
  default: ({ children, submitLabel }: { children?: React.ReactNode; submitLabel: string }) => (
    <form aria-label="create-plant-form">
      {children}
      <button type="submit">{submitLabel}</button>
    </form>
  ),
}));

const onPlace = vi.fn();
const onOpenChange = vi.fn();

function renderDialog(unplacedPlants = [mockUserPlant]) {
  return render(
    <PlacePlantDialog
      open
      onOpenChange={onOpenChange}
      cell={{ x: 2, y: 1 }}
      unplacedPlants={unplacedPlants}
      onPlace={onPlace}
      isPlacing={false}
      gardenId="garden-1"
      bedId="bed-1"
    />,
  );
}

describe('PlacePlantDialog', () => {
  it('shows the cell position in the title', () => {
    renderDialog();
    expect(screen.getByText(/column 3, row 2/i)).toBeInTheDocument();
  });

  it('renders a button for each unplaced plant', () => {
    renderDialog([
      mockUserPlant,
      { ...mockUserPlant, id: 'plant-2', plantName: 'Basil' },
    ]);
    expect(screen.getByRole('button', { name: /tomato/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /basil/i })).toBeInTheDocument();
  });

  it('shows an empty message when there are no unplaced plants', () => {
    renderDialog([]);
    expect(screen.getByText(/no unplaced plants in this bed/i)).toBeInTheDocument();
  });

  it('calls onPlace with the plant id when a plant is clicked', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /tomato/i }));

    expect(onPlace).toHaveBeenCalledWith('plant-1');
  });

  it('disables plant buttons while placing', () => {
    render(
      <PlacePlantDialog
        open
        onOpenChange={onOpenChange}
        cell={{ x: 0, y: 0 }}
        unplacedPlants={[mockUserPlant]}
        onPlace={onPlace}
        isPlacing
        gardenId="garden-1"
        bedId="bed-1"
      />,
    );
    expect(screen.getByRole('button', { name: /tomato/i })).toBeDisabled();
  });

  it('shows the create form when "Add new plant" is clicked', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /add new plant/i }));

    expect(screen.getByRole('form', { name: 'create-plant-form' })).toBeInTheDocument();
  });

  it('updates the title when switching to the create step', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /add new plant/i }));

    expect(screen.getByText(/new plant/i)).toBeInTheDocument();
  });

  it('returns to the pick step when Back is clicked', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /add new plant/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.queryByRole('form', { name: 'create-plant-form' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tomato/i })).toBeInTheDocument();
  });
});
