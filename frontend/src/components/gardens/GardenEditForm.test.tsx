import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { updateGarden } from '@/api/gardens';
import { mockGarden } from '@/test/fixtures';
import GardenEditForm from './GardenEditForm';

vi.mock('@/api/gardens', () => ({ updateGarden: vi.fn() }));

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
  vi.mocked(updateGarden).mockResolvedValue(mockGarden);
  onOpenChange.mockReset();
});

describe('GardenEditForm', () => {
  it('pre-fills the name and description from the garden', async () => {
    render(<GardenEditForm garden={mockGarden} open={true} onOpenChange={onOpenChange} />);

    expect(await screen.findByDisplayValue('Front Yard')).toBeInTheDocument();
    expect(screen.getByDisplayValue('My main garden')).toBeInTheDocument();
  });

  it('calls updateGarden with the updated values on submit', async () => {
    const user = userEvent.setup();
    render(<GardenEditForm garden={mockGarden} open={true} onOpenChange={onOpenChange} />);

    const nameInput = await screen.findByRole('textbox', { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'Back Yard');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(updateGarden).toHaveBeenCalledWith(
        'garden-1',
        expect.objectContaining({ name: 'Back Yard' }),
      ),
    );
  });

  it('closes the sheet after a successful save', async () => {
    const user = userEvent.setup();
    render(<GardenEditForm garden={mockGarden} open={true} onOpenChange={onOpenChange} />);

    const nameInput = await screen.findByRole('textbox', { name: /name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'Back Yard');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
