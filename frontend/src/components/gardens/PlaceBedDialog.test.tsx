import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { mockBed } from '@/test/fixtures';
import { createBed } from '@/api/beds';
import PlaceBedDialog from './PlaceBedDialog';

vi.mock('@/api/beds', () => ({ createBed: vi.fn() }));

const onPlace = vi.fn();
const onOpenChange = vi.fn();

function renderDialog({ unplacedBeds = [mockBed], isPlacing = false } = {}) {
  return render(
    <PlaceBedDialog
      open
      onOpenChange={onOpenChange}
      cell={{ x: 1, y: 0 }}
      gardenId="garden-1"
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

  it('always shows the "Create new bed" button', () => {
    renderDialog({ unplacedBeds: [] });
    expect(screen.getByRole('button', { name: /create new bed/i })).toBeInTheDocument();
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

  describe('create step', () => {
    async function openCreateStep() {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /create new bed/i }));
      return user;
    }

    it('shows the create form when "Create new bed" is clicked', async () => {
      await openCreateStep();
      expect(screen.getByRole('heading', { name: /new bed/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /length/i })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /width/i })).toBeInTheDocument();
    });

    it('goes back to the pick step via the Back button', async () => {
      const user = await openCreateStep();
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByRole('heading', { name: /place a bed/i })).toBeInTheDocument();
    });

    it('creates a bed and calls onPlace on successful submit', async () => {
      vi.mocked(createBed).mockResolvedValue(mockBed);
      const user = await openCreateStep();

      await user.type(screen.getByLabelText(/name/i), 'Test Bed');
      await user.type(screen.getByRole('spinbutton', { name: /length/i }), '4');
      await user.type(screen.getByRole('spinbutton', { name: /width/i }), '4');
      await user.click(screen.getByRole('button', { name: /create & place/i }));

      await waitFor(() => expect(onPlace).toHaveBeenCalledWith('bed-1'));
    });
  });
});
