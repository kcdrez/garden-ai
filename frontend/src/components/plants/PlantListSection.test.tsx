import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { deleteUserPlant } from '@/api/plants';
import { mockUserPlant } from '@/test/fixtures';
import type { UserPlant } from '@/types/plants';
import PlantListSection from './PlantListSection';

vi.mock('@/api/plants', () => ({ deleteUserPlant: vi.fn() }));

const mockConfirm = vi.fn();
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/components/ui/card-actions-menu', () => ({
  default: ({
    onEdit,
    onMove,
    onDelete,
  }: {
    onEdit: () => void;
    onMove?: () => void;
    onDelete: () => void;
  }) => (
    <>
      <button onClick={onEdit}>Edit</button>
      {onMove && <button onClick={onMove}>Move</button>}
      <button onClick={onDelete}>Delete</button>
    </>
  ),
}));

vi.mock('@/components/plants/PlantTimeline', () => ({
  default: ({ plant }: { plant: UserPlant }) => (
    <div data-testid="plant-timeline">{plant.plantName}</div>
  ),
}));

vi.mock('@/components/plants/UserPlantDialog', () => ({
  default: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Plant dialog">
        <button onClick={() => onOpenChange(false)}>Close plant dialog</button>
      </div>
    ) : null,
}));

vi.mock('@/components/plants/MovePlantDialog', () => ({
  default: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Move Plant dialog">
        <button onClick={() => onOpenChange(false)}>Close move dialog</button>
      </div>
    ) : null,
}));

function renderSection(
  props: Partial<React.ComponentProps<typeof PlantListSection>> = {},
) {
  return render(
    <PlantListSection
      gardenId="garden-1"
      bedId="bed-1"
      userPlants={[]}
      isLoading={false}
      error={null}
      {...props}
    />,
  );
}

beforeEach(() => {
  vi.mocked(deleteUserPlant).mockResolvedValue(undefined);
  mockConfirm.mockResolvedValue(true);
});

describe('PlantListSection', () => {
  it('shows loading state', () => {
    renderSection({ isLoading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty message when no plants', () => {
    renderSection({ userPlants: [] });
    expect(screen.getByText(/no plants yet/i)).toBeInTheDocument();
  });

  it('renders a link for each plant', () => {
    renderSection({ userPlants: [mockUserPlant] });
    expect(screen.getByRole('link', { name: /tomato/i })).toBeInTheDocument();
  });

  it('opens add plant dialog when Add Plant is clicked', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: /add plant/i }));

    expect(screen.getByRole('dialog', { name: /plant dialog/i })).toBeInTheDocument();
  });

  it('expands the timeline when the chevron is clicked', async () => {
    const user = userEvent.setup();
    renderSection({ userPlants: [mockUserPlant] });

    expect(screen.queryByTestId('plant-timeline')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '' })); // chevron button

    expect(screen.getByTestId('plant-timeline')).toBeInTheDocument();
  });

  it('opens the edit dialog when Edit is clicked', async () => {
    const user = userEvent.setup();
    renderSection({ userPlants: [mockUserPlant] });

    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    expect(screen.getByRole('dialog', { name: /plant dialog/i })).toBeInTheDocument();
  });

  it('opens the move dialog when Move is clicked', async () => {
    const user = userEvent.setup();
    renderSection({ userPlants: [mockUserPlant] });

    await user.click(screen.getByRole('button', { name: /^move$/i }));

    expect(screen.getByRole('dialog', { name: /move plant dialog/i })).toBeInTheDocument();
  });

  it('calls deleteUserPlant when delete is confirmed', async () => {
    const user = userEvent.setup();
    renderSection({ userPlants: [mockUserPlant] });

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() =>
      expect(deleteUserPlant).toHaveBeenCalledWith('garden-1', 'bed-1', 'plant-1'),
    );
  });

  it('does not call deleteUserPlant when delete is cancelled', async () => {
    const user = userEvent.setup();
    mockConfirm.mockResolvedValue(false);
    renderSection({ userPlants: [mockUserPlant] });

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(deleteUserPlant).not.toHaveBeenCalled();
  });

  it('closes the plant dialog and clears editingPlant', async () => {
    const user = userEvent.setup();
    renderSection({ userPlants: [mockUserPlant] });

    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(screen.getByRole('dialog', { name: /plant dialog/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close plant dialog/i }));
    expect(screen.queryByRole('dialog', { name: /plant dialog/i })).not.toBeInTheDocument();
  });

  it('closes the move dialog when cancelled', async () => {
    const user = userEvent.setup();
    renderSection({ userPlants: [mockUserPlant] });

    await user.click(screen.getByRole('button', { name: /^move$/i }));
    expect(screen.getByRole('dialog', { name: /move plant dialog/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close move dialog/i }));
    expect(screen.queryByRole('dialog', { name: /move plant dialog/i })).not.toBeInTheDocument();
  });

  it('shows the variety when the plant has one', () => {
    const plantWithVariety = { ...mockUserPlant, variety: 'Cherry' };
    renderSection({ userPlants: [plantWithVariety] });

    expect(screen.getByText(/cherry/i)).toBeInTheDocument();
  });

  it('collapses the timeline when the chevron is clicked twice', async () => {
    const user = userEvent.setup();
    renderSection({ userPlants: [mockUserPlant] });

    const chevron = screen.getByRole('button', { name: '' });
    await user.click(chevron);
    expect(screen.getByTestId('plant-timeline')).toBeInTheDocument();

    await user.click(chevron);
    expect(screen.queryByTestId('plant-timeline')).not.toBeInTheDocument();
  });

  it('includes variety in the delete confirmation description', async () => {
    const user = userEvent.setup();
    const plantWithVariety = { ...mockUserPlant, variety: 'Cherry' };
    renderSection({ userPlants: [plantWithVariety] });

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() =>
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Cherry'),
        }),
      ),
    );
  });
});
