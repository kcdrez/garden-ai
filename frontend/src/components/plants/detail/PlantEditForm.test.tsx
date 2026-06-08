import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { updateUserPlant, fetchPlants } from '@/api/plants';
import { mockUserPlant } from '@/test/fixtures';
import type { UserPlantFormValues } from '@/schemas/plants';
import PlantEditForm from './PlantEditForm';

vi.mock('@/api/plants', () => ({ updateUserPlant: vi.fn(), fetchPlants: vi.fn() }));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <>{children}</> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetFooter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/plants/shared/PlantPicker', () => ({
  default: ({ name }: { name: keyof UserPlantFormValues }) => (
    <input aria-label="Plant" name={String(name)} defaultValue="catalog-1" />
  ),
}));

const onOpenChange = vi.fn();

beforeEach(() => {
  vi.mocked(updateUserPlant).mockResolvedValue(mockUserPlant);
  vi.mocked(fetchPlants).mockResolvedValue([]);
  onOpenChange.mockReset();
});

describe('PlantEditForm', () => {
  it('pre-fills the status from the plant', async () => {
    render(<PlantEditForm userPlant={mockUserPlant} open={true} onOpenChange={onOpenChange} />);

    const growingButton = await screen.findByRole('button', { name: /growing/i });
    expect(growingButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls updateUserPlant with the updated values on submit', async () => {
    const user = userEvent.setup();
    render(<PlantEditForm userPlant={mockUserPlant} open={true} onOpenChange={onOpenChange} />);

    const varietyInput = await screen.findByRole('textbox', { name: /variety/i });
    await user.type(varietyInput, 'Cherry');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(updateUserPlant).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        'plant-1',
        expect.objectContaining({ variety: 'Cherry', status: 'growing' }),
      ),
    );
  });

  it('closes the sheet after a successful save', async () => {
    const user = userEvent.setup();
    render(<PlantEditForm userPlant={mockUserPlant} open={true} onOpenChange={onOpenChange} />);

    const varietyInput = await screen.findByRole('textbox', { name: /variety/i });
    await user.type(varietyInput, 'Cherry');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('applies server errors to the form on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(updateUserPlant).mockRejectedValue(new Error('Server error'));
    render(<PlantEditForm userPlant={mockUserPlant} open={true} onOpenChange={onOpenChange} />);

    const varietyInput = await screen.findByRole('textbox', { name: /variety/i });
    await user.type(varietyInput, 'Cherry');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());
  });
});
