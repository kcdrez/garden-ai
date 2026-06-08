import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { mockBed } from '@/test/fixtures';
import { createBed } from '@/api/beds';
import PlaceOnCanvasDialog from './PlaceOnCanvasDialog';

vi.mock('@/api/beds', () => ({ createBed: vi.fn() }));
vi.mock('@/lib/features', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/features')>();
  return { ...mod, featureImage: () => null };
});

const onPlace = vi.fn();
const onPlaceFeature = vi.fn();
const onOpenChange = vi.fn();

function renderDialog({ unplacedBeds = [mockBed], isPlacing = false } = {}) {
  return render(
    <PlaceOnCanvasDialog
      open
      onOpenChange={onOpenChange}
      cell={{ x: 1, y: 0 }}
      gardenId="garden-1"
      unplacedBeds={unplacedBeds}
      onPlace={onPlace}
      isPlacing={isPlacing}
      onPlaceFeature={onPlaceFeature}
    />,
  );
}

describe('PlaceOnCanvasDialog', () => {
  describe('choose step', () => {
    it('shows the two placement options', () => {
      renderDialog();
      expect(screen.getByRole('heading', { name: /add to garden/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /place a bed/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /place a feature/i })).toBeInTheDocument();
    });

    it('navigates to the bed step', async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /place a bed/i }));
      expect(screen.getByRole('heading', { name: /^place a bed$/i })).toBeInTheDocument();
    });

    it('navigates to the feature step', async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /place a feature/i }));
      expect(screen.getByRole('heading', { name: /add feature/i })).toBeInTheDocument();
    });
  });

  describe('bed step', () => {
    async function openBedStep() {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /place a bed/i }));
      return user;
    }

    it('shows "all beds placed" message when there are no unplaced beds', async () => {
      const user = userEvent.setup();
      render(
        <PlaceOnCanvasDialog
          open
          onOpenChange={onOpenChange}
          cell={{ x: 1, y: 0 }}
          gardenId="garden-1"
          unplacedBeds={[]}
          onPlace={onPlace}
          isPlacing={false}
          onPlaceFeature={onPlaceFeature}
        />,
      );
      await user.click(screen.getByRole('button', { name: /place a bed/i }));
      expect(screen.getByText(/all beds in this garden are already placed/i)).toBeInTheDocument();
    });

    it('always shows the "Create new bed" button', async () => {
      await openBedStep();
      expect(screen.getByRole('button', { name: /create new bed/i })).toBeInTheDocument();
    });

    it('shows an available bed and calls onPlace when clicked', async () => {
      const user = await openBedStep();
      const btn = screen.getByRole('button', { name: /raised bed 1/i });
      expect(btn).not.toBeDisabled();
      await user.click(btn);
      expect(onPlace).toHaveBeenCalledWith('bed-1');
    });

    it('disables bed buttons while placing', async () => {
      const user = userEvent.setup();
      renderDialog({ isPlacing: true });
      await user.click(screen.getByRole('button', { name: /place a bed/i }));
      expect(screen.getByRole('button', { name: /raised bed 1/i })).toBeDisabled();
    });

    it('goes back to the choose step via the Back button', async () => {
      const user = await openBedStep();
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByRole('heading', { name: /add to garden/i })).toBeInTheDocument();
    });
  });

  describe('bed create step', () => {
    async function openCreateStep() {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /place a bed/i }));
      await user.click(screen.getByRole('button', { name: /create new bed/i }));
      return user;
    }

    it('shows the create form', async () => {
      await openCreateStep();
      expect(screen.getByRole('heading', { name: /new bed/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /length/i })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /width/i })).toBeInTheDocument();
    });

    it('goes back to the bed step via the Back button', async () => {
      const user = await openCreateStep();
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByRole('heading', { name: /^place a bed$/i })).toBeInTheDocument();
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

  describe('feature step', () => {
    async function openFeatureStep() {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /place a feature/i }));
      return user;
    }

    it('shows the feature type picker', async () => {
      await openFeatureStep();
      expect(screen.getByRole('heading', { name: /add feature/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /shed/i })).toBeInTheDocument();
    });

    it('goes back to the choose step via the Back button', async () => {
      const user = await openFeatureStep();
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByRole('heading', { name: /add to garden/i })).toBeInTheDocument();
    });

    it('calls onPlaceFeature when a type is selected and Place Feature is clicked', async () => {
      const user = await openFeatureStep();
      await user.click(screen.getByRole('button', { name: /shed/i }));
      await user.click(screen.getByRole('button', { name: /^add$/i }));
      expect(onPlaceFeature).toHaveBeenCalledWith('shed', '');
    });

    it('shows a label input when a custom type is selected', async () => {
      const user = await openFeatureStep();
      await user.click(screen.getByRole('button', { name: /custom area \(circle\)/i }));
      expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
    });

    it('calls onPlaceFeature with the entered label for a custom type', async () => {
      const user = await openFeatureStep();
      await user.click(screen.getByRole('button', { name: /custom area \(circle\)/i }));
      await user.type(screen.getByLabelText(/label/i), 'Pond');
      await user.click(screen.getByRole('button', { name: /^add$/i }));
      expect(onPlaceFeature).toHaveBeenCalledWith('custom_circle', 'Pond');
    });
  });

  it('resets to the choose step when the dialog is closed and reopened', async () => {
    const user = userEvent.setup();
    const { rerender } = renderDialog();

    await user.click(screen.getByRole('button', { name: /place a bed/i }));
    expect(screen.getByRole('heading', { name: /^place a bed$/i })).toBeInTheDocument();

    rerender(
      <PlaceOnCanvasDialog
        open={false}
        onOpenChange={onOpenChange}
        cell={null}
        gardenId="garden-1"
        unplacedBeds={[mockBed]}
        onPlace={onPlace}
        isPlacing={false}
        onPlaceFeature={onPlaceFeature}
      />,
    );
    rerender(
      <PlaceOnCanvasDialog
        open
        onOpenChange={onOpenChange}
        cell={null}
        gardenId="garden-1"
        unplacedBeds={[mockBed]}
        onPlace={onPlace}
        isPlacing={false}
        onPlaceFeature={onPlaceFeature}
      />,
    );
    expect(screen.getByRole('heading', { name: /add to garden/i })).toBeInTheDocument();
  });
});
