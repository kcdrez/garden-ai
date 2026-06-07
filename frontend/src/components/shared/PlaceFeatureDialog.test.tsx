import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import PlaceFeatureDialog from './PlaceFeatureDialog';

vi.mock('@/lib/features', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/features')>();
  return { ...mod, featureImage: () => null };
});

const onPlace = vi.fn();
const onOpenChange = vi.fn();

function renderDialog({ scope = 'garden' as 'garden' | 'bed' } = {}) {
  return render(
    <PlaceFeatureDialog
      open
      onOpenChange={onOpenChange}
      scope={scope}
      onPlace={onPlace}
    />,
  );
}

describe('PlaceFeatureDialog', () => {
  it('shows the feature type picker', () => {
    renderDialog();
    expect(screen.getByRole('heading', { name: /add feature/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shed/i })).toBeInTheDocument();
  });

  it('Add button is disabled until a type is selected', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled();
  });

  it('calls onPlace with selected type and empty label on submit', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: /shed/i }));
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(onPlace).toHaveBeenCalledWith('shed', '');
  });

  it('filters types by scope — garden-only types visible for garden scope', () => {
    renderDialog({ scope: 'garden' });
    expect(screen.getByRole('button', { name: /fountain/i })).toBeInTheDocument();
  });

  it('filters types by scope — bed-only types visible for bed scope', () => {
    renderDialog({ scope: 'bed' });
    expect(screen.getByRole('button', { name: /tomato cage/i })).toBeInTheDocument();
  });

  it('filters types by scope — garden-only types not shown for bed scope', () => {
    renderDialog({ scope: 'bed' });
    expect(screen.queryByRole('button', { name: /^shed$/i })).not.toBeInTheDocument();
  });

  describe('custom types', () => {
    it('shows label input when a custom type is selected', async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /custom area \(rectangle\)/i }));
      expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
    });

    it('Add button is disabled for custom type until label is entered', async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /custom area \(rectangle\)/i }));
      expect(screen.getByRole('button', { name: /^add$/i })).toBeDisabled();
    });

    it('enables Add button once label is typed', async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /custom area \(rectangle\)/i }));
      await user.type(screen.getByLabelText(/label/i), 'Fairy Garden');
      expect(screen.getByRole('button', { name: /^add$/i })).not.toBeDisabled();
    });

    it('calls onPlace with label for custom type', async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /custom area \(rectangle\)/i }));
      await user.type(screen.getByLabelText(/label/i), 'Fairy Garden');
      await user.click(screen.getByRole('button', { name: /^add$/i }));
      expect(onPlace).toHaveBeenCalledWith('custom_rect', 'Fairy Garden');
    });

    it('clears label input when switching from custom to non-custom type', async () => {
      const user = userEvent.setup();
      renderDialog();
      await user.click(screen.getByRole('button', { name: /custom area \(rectangle\)/i }));
      await user.type(screen.getByLabelText(/label/i), 'Fairy Garden');
      await user.click(screen.getByRole('button', { name: /shed/i }));
      expect(screen.queryByLabelText(/label/i)).not.toBeInTheDocument();
    });
  });
});
