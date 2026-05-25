import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchAllBeds, createBed } from '@/api/beds';
import { fetchGardens } from '@/api/gardens';
import { moveUserPlant } from '@/api/plants';
import { mockUserPlant, mockBed } from '@/test/fixtures';
import type { GardenBed } from '@/types/gardens';
import MovePlantDialog from './MovePlantDialog';

vi.mock('@/api/beds', () => ({ fetchAllBeds: vi.fn(), createBed: vi.fn() }));
vi.mock('@/api/gardens', () => ({ fetchGardens: vi.fn() }));
vi.mock('@/api/plants', () => ({ moveUserPlant: vi.fn() }));

const onOpenChange = vi.fn();

const otherBed: GardenBed = { ...mockBed, id: 'bed-2', name: 'Back Raised Bed' };

beforeEach(() => {
  vi.mocked(fetchAllBeds).mockResolvedValue([mockBed, otherBed]);
  vi.mocked(fetchGardens).mockResolvedValue([]);
  vi.mocked(moveUserPlant).mockResolvedValue(mockUserPlant);
  vi.mocked(createBed).mockResolvedValue(otherBed);
});

describe('MovePlantDialog', () => {
  it('shows the pick step title on open', () => {
    render(<MovePlantDialog userPlant={mockUserPlant} open onOpenChange={onOpenChange} />);
    expect(screen.getByText(/move tomato to another bed/i)).toBeInTheDocument();
  });

  it('lists beds other than the current bed', async () => {
    render(<MovePlantDialog userPlant={mockUserPlant} open onOpenChange={onOpenChange} />);
    // mockUserPlant.bed = 'bed-1', so 'Raised Bed 1' should be excluded
    expect(await screen.findByRole('button', { name: /back raised bed/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^raised bed 1$/i })).not.toBeInTheDocument();
  });

  it('shows "no other beds" when no alternatives exist', async () => {
    vi.mocked(fetchAllBeds).mockResolvedValue([mockBed]); // only the current bed
    render(<MovePlantDialog userPlant={mockUserPlant} open onOpenChange={onOpenChange} />);
    expect(await screen.findByText(/no other beds yet/i)).toBeInTheDocument();
  });

  it('navigates to the create step when Create new bed is clicked', async () => {
    const user = userEvent.setup();
    render(<MovePlantDialog userPlant={mockUserPlant} open onOpenChange={onOpenChange} />);
    await screen.findByRole('button', { name: /back raised bed/i });

    await user.click(screen.getByRole('button', { name: /create new bed/i }));

    expect(screen.getByText('Create a New Bed')).toBeInTheDocument();
  });

  it('navigates back to the pick step when Back is clicked', async () => {
    const user = userEvent.setup();
    render(<MovePlantDialog userPlant={mockUserPlant} open onOpenChange={onOpenChange} />);
    await screen.findByRole('button', { name: /back raised bed/i });

    await user.click(screen.getByRole('button', { name: /create new bed/i }));
    await user.click(screen.getByRole('button', { name: /^back$/i }));

    expect(screen.getByText(/move tomato to another bed/i)).toBeInTheDocument();
  });

  it('calls moveUserPlant with the selected bed id', async () => {
    const user = userEvent.setup();
    render(<MovePlantDialog userPlant={mockUserPlant} open onOpenChange={onOpenChange} />);

    await user.click(await screen.findByRole('button', { name: /back raised bed/i }));
    await user.click(screen.getByRole('button', { name: /move plant/i }));

    await waitFor(() =>
      expect(moveUserPlant).toHaveBeenCalledWith('garden-1', 'bed-1', 'plant-1', 'bed-2'),
    );
  });
});
