import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { updateBed } from '@/api/beds';
import { mockBed } from '@/test/fixtures';
import BedEditForm from './BedEditForm';

vi.mock('@/api/beds', () => ({ updateBed: vi.fn() }));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <>{children}</> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetFooter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const onOpenChange = vi.fn();

beforeEach(() => {
  vi.mocked(updateBed).mockResolvedValue(mockBed);
  onOpenChange.mockReset();
});

describe('BedEditForm', () => {
  it('pre-fills the name, length, and width from the bed', async () => {
    render(<BedEditForm bed={mockBed} open={true} onOpenChange={onOpenChange} />);

    expect(await screen.findByDisplayValue('Raised Bed 1')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('4')).toHaveLength(2);
  });

  it('calls updateBed with the updated values on submit', async () => {
    const user = userEvent.setup();
    render(<BedEditForm bed={mockBed} open={true} onOpenChange={onOpenChange} />);

    const nameInput = await screen.findByRole('textbox', { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'Main Bed');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(updateBed).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        expect.objectContaining({ name: 'Main Bed' }),
      ),
    );
  });

  it('closes the sheet after a successful save', async () => {
    const user = userEvent.setup();
    render(<BedEditForm bed={mockBed} open={true} onOpenChange={onOpenChange} />);

    const nameInput = await screen.findByRole('textbox', { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'Main Bed');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('pre-fills depth when the bed has one', async () => {
    const bedWithDepth = { ...mockBed, depth: 12, avgSunlightHours: 6 };
    render(<BedEditForm bed={bedWithDepth} open={true} onOpenChange={onOpenChange} />);

    expect(await screen.findByDisplayValue('12')).toBeInTheDocument();
  });

  it('applies server errors to the form on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(updateBed).mockRejectedValue(new Error('Server error'));
    render(<BedEditForm bed={mockBed} open={true} onOpenChange={onOpenChange} />);

    const nameInput = await screen.findByRole('textbox', { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'Main Bed');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());
  });

  it('submits depth and avgSunlightHours as integers when present', async () => {
    const user = userEvent.setup();
    const bedWithOptionals = { ...mockBed, depth: 12, avgSunlightHours: 6 };
    render(<BedEditForm bed={bedWithOptionals} open={true} onOpenChange={onOpenChange} />);

    await screen.findByDisplayValue('12');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(updateBed).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        expect.objectContaining({ depth: 12, avgSunlightHours: 6 }),
      ),
    );
  });

  it('updates the facing field when a direction is selected', async () => {
    const user = userEvent.setup();
    render(<BedEditForm bed={mockBed} open={true} onOpenChange={onOpenChange} />);

    const facingSelect = await screen.findByRole('combobox', { name: /facing/i });
    await user.selectOptions(facingSelect, 'N');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(updateBed).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        expect.objectContaining({ facing: 'N' }),
      ),
    );
  });
});
