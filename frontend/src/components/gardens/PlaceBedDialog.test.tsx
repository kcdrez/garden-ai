import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { mockBed } from '@/test/fixtures';
import PlaceBedDialog from './PlaceBedDialog';

const onPlace = vi.fn();
const onOpenChange = vi.fn();

function renderDialog({ unplacedBeds = [mockBed], isPlacing = false } = {}) {
  return render(
    <PlaceBedDialog
      open
      onOpenChange={onOpenChange}
      cell={{ x: 1, y: 0 }}
      unplacedBeds={unplacedBeds}
      onPlace={onPlace}
      isPlacing={isPlacing}
    />,
  );
}

describe('PlaceBedDialog', () => {
  it('shows "all beds placed" message when there are no unplaced beds', () => {
    renderDialog({ unplacedBeds: [] });
    expect(screen.getByText(/all beds in this garden are already placed/i)).toBeInTheDocument();
  });

  it('shows an available bed and calls onPlace when clicked', async () => {
    const user = userEvent.setup();
    renderDialog();

    const btn = screen.getByRole('button', { name: /raised bed 1/i });
    expect(btn).not.toBeDisabled();

    await user.click(btn);

    expect(onPlace).toHaveBeenCalledWith('bed-1');
  });

  it('disables bed buttons while placing', () => {
    renderDialog({ isPlacing: true });
    expect(screen.getByRole('button', { name: /raised bed 1/i })).toBeDisabled();
  });
});
