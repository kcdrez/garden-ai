import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { createBed, updateBed } from '@/api/beds';
import { mockBed } from '@/test/fixtures';
import BedDialog from './BedDialog';

vi.mock('@/api/beds', () => ({ createBed: vi.fn(), updateBed: vi.fn() }));
vi.mock('@/api/gardens', () => ({ fetchGardens: vi.fn().mockResolvedValue([]) }));

const onOpenChange = vi.fn();

beforeEach(() => {
  vi.mocked(createBed).mockResolvedValue(mockBed);
  vi.mocked(updateBed).mockResolvedValue(mockBed);
});

describe('BedDialog', () => {
  it('shows the Add Bed submit button in create mode', () => {
    render(<BedDialog gardenId="garden-1" open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('button', { name: /add bed/i })).toBeInTheDocument();
  });

  it('shows "Edit Bed" title in edit mode', () => {
    render(<BedDialog gardenId="garden-1" bed={mockBed} open onOpenChange={onOpenChange} />);
    expect(screen.getByText('Edit Bed')).toBeInTheDocument();
  });

  it('pre-fills fields in edit mode', () => {
    render(<BedDialog gardenId="garden-1" bed={mockBed} open onOpenChange={onOpenChange} />);
    expect(screen.getByLabelText(/^name$/i)).toHaveValue('Raised Bed 1');
    expect(screen.getByLabelText(/^length$/i)).toHaveValue('4');
    expect(screen.getByLabelText(/^width$/i)).toHaveValue('4');
  });

  it('submit is disabled until required fields are filled', () => {
    render(<BedDialog gardenId="garden-1" open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('button', { name: /add bed/i })).toBeDisabled();
  });

  it('calls createBed on submit in create mode', async () => {
    const user = userEvent.setup();
    render(<BedDialog gardenId="garden-1" open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText(/^name$/i), 'Herb Bed');
    await user.type(screen.getByLabelText(/^length$/i), '3');
    await user.type(screen.getByLabelText(/^width$/i), '2');
    await user.click(screen.getByRole('button', { name: /add bed/i }));

    await waitFor(() =>
      expect(createBed).toHaveBeenCalledWith(
        'garden-1',
        expect.objectContaining({ name: 'Herb Bed', length: 3, width: 2 }),
      ),
    );
  });

  it('calls updateBed on submit in edit mode', async () => {
    const user = userEvent.setup();
    render(<BedDialog gardenId="garden-1" bed={mockBed} open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(updateBed).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        expect.objectContaining({ name: 'Raised Bed 1' }),
      ),
    );
  });

  it('calls onOpenChange(false) after a successful submit', async () => {
    const user = userEvent.setup();
    render(<BedDialog gardenId="garden-1" bed={mockBed} open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
