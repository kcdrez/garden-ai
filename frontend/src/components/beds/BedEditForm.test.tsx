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
});
