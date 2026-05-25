import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { mockUserPlant } from '@/test/fixtures';
import PlacePlantDialog from './PlacePlantDialog';

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

  it('shows "all placed" message when there are no unplaced plants', () => {
    renderDialog([]);
    expect(screen.getByText(/all plants in this bed are already placed/i)).toBeInTheDocument();
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
      />,
    );
    expect(screen.getByRole('button', { name: /tomato/i })).toBeDisabled();
  });
});
