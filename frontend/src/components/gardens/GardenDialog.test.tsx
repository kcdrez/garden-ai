import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { createGarden, updateGarden } from '@/api/gardens';
import { mockGarden } from '@/test/fixtures';
import GardenDialog from './GardenDialog';

vi.mock('@/api/gardens', () => ({ createGarden: vi.fn(), updateGarden: vi.fn() }));

const onOpenChange = vi.fn();

beforeEach(() => {
  vi.mocked(createGarden).mockResolvedValue(mockGarden);
  vi.mocked(updateGarden).mockResolvedValue(mockGarden);
});

describe('GardenDialog', () => {
  it('shows the Add Garden submit button in create mode', () => {
    render(<GardenDialog open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('button', { name: /add garden/i })).toBeInTheDocument();
  });

  it('shows "Edit Garden" title in edit mode', () => {
    render(<GardenDialog garden={mockGarden} open onOpenChange={onOpenChange} />);
    expect(screen.getByText('Edit Garden')).toBeInTheDocument();
  });

  it('pre-fills the name field in edit mode', () => {
    render(<GardenDialog garden={mockGarden} open onOpenChange={onOpenChange} />);
    expect(screen.getByLabelText(/name/i)).toHaveValue('Front Yard');
  });

  it('submit button is disabled when name is empty', () => {
    render(<GardenDialog open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('button', { name: /add garden/i })).toBeDisabled();
  });

  it('enables submit once a name is typed', async () => {
    const user = userEvent.setup();
    render(<GardenDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText(/name/i), 'My Garden');

    expect(screen.getByRole('button', { name: /add garden/i })).not.toBeDisabled();
  });

  it('calls createGarden with the form values on submit', async () => {
    const user = userEvent.setup();
    render(<GardenDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText(/name/i), 'My Garden');
    await user.click(screen.getByRole('button', { name: /add garden/i }));

    await waitFor(() =>
      expect(createGarden).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Garden' }),
      ),
    );
  });

  it('calls updateGarden on submit when editing', async () => {
    const user = userEvent.setup();
    render(<GardenDialog garden={mockGarden} open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(updateGarden).toHaveBeenCalledWith(
        'garden-1',
        expect.objectContaining({ name: 'Front Yard' }),
      ),
    );
  });

  it('calls onOpenChange(false) after a successful submit', async () => {
    const user = userEvent.setup();
    render(<GardenDialog garden={mockGarden} open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
