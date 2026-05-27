import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchPlacements, createPlacement, movePlacement, deletePlacement } from '@/api/plants';
import { mockBed, mockUserPlant } from '@/test/fixtures';
import BedGrid from './BedGrid';

vi.mock('@/api/plants', () => ({
  fetchPlacements: vi.fn(),
  createPlacement: vi.fn(),
  movePlacement: vi.fn(),
  deletePlacement: vi.fn(),
}));

vi.mock('@/components/shared/PlacementCanvas', () => ({
  default: ({ items, onEmptyClick, onMove, onRemove }: {
    items: { id: string }[];
    onEmptyClick: (x: number, y: number) => void;
    onMove: (id: string, x: number, y: number) => void;
    onRemove: (id: string) => void;
  }) => (
    <div data-testid="placement-canvas">
      <button onClick={() => onEmptyClick(1.5, 2.0)}>Click canvas</button>
      {items.map((item) => (
        <div key={item.id} data-testid={`canvas-item-${item.id}`}>
          <button onClick={() => onMove(item.id, 3.0, 4.0)}>Drag {item.id}</button>
          <button onClick={() => onRemove(item.id)}>Delete {item.id}</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/plants/PlacePlantDialog', () => ({
  default: ({ open, onPlace }: { open: boolean; onPlace: (id: string) => void }) =>
    open ? (
      <div role="dialog" aria-label="Place Plant Dialog">
        <button onClick={() => onPlace('plant-1')}>Place plant-1</button>
      </div>
    ) : null,
}));

const mockFetchPlacements = vi.mocked(fetchPlacements);
const mockCreatePlacement = vi.mocked(createPlacement);
const mockMovePlacement = vi.mocked(movePlacement);
const mockDeletePlacement = vi.mocked(deletePlacement);

const bed = { ...mockBed, length: 8, width: 4, unit: 'ft' as const };
const placement = { id: 'pl-1', userPlant: 'plant-1', bed: 'bed-1', x: 0, y: 0, width: 1.5, height: 1.5, createdAt: '', updatedAt: '' };

function renderBedGrid(userPlants = [mockUserPlant]) {
  return render(
    <BedGrid gardenId="garden-1" bedId="bed-1" bed={bed} userPlants={userPlants} />,
  );
}

describe('BedGrid', () => {
  beforeEach(() => {
    mockFetchPlacements.mockResolvedValue([]);
    mockCreatePlacement.mockResolvedValue(placement);
    mockMovePlacement.mockResolvedValue(placement);
    mockDeletePlacement.mockResolvedValue(undefined);
  });

  it('shows loading spinner while placements load', () => {
    mockFetchPlacements.mockReturnValue(new Promise(() => {}));
    renderBedGrid();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders PlacementCanvas once placements load', async () => {
    renderBedGrid();
    await screen.findByTestId('placement-canvas');
  });

  it('shows unplaced plants panel when a plant has no placement', async () => {
    renderBedGrid();
    await screen.findByText(/unplaced plants/i);
    expect(screen.getByText('Tomato')).toBeInTheDocument();
  });

  it('hides unplaced plants panel when all plants are placed', async () => {
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('placement-canvas');
    expect(screen.queryByText(/unplaced plants/i)).not.toBeInTheDocument();
  });

  it('opens PlacePlantDialog when the canvas is clicked', async () => {
    const user = userEvent.setup();
    renderBedGrid();
    await screen.findByTestId('placement-canvas');
    await user.click(screen.getByRole('button', { name: /click canvas/i }));
    expect(screen.getByRole('dialog', { name: /place plant dialog/i })).toBeInTheDocument();
  });

  it('calls createPlacement with plant spacing when a plant is placed', async () => {
    const user = userEvent.setup();
    renderBedGrid();
    await screen.findByTestId('placement-canvas');
    await user.click(screen.getByRole('button', { name: /click canvas/i }));
    await user.click(screen.getByRole('button', { name: /place plant-1/i }));
    await waitFor(() => {
      expect(mockCreatePlacement).toHaveBeenCalledWith(
        'garden-1', 'bed-1',
        expect.objectContaining({ userPlant: 'plant-1', x: 1.5, y: 2.0, width: 1.5, height: 1.5 }),
      );
    });
  });

  it('defaults spacing to 1.0 when plant has no defaultSpacingFt', async () => {
    const user = userEvent.setup();
    const noSpacingPlant = { ...mockUserPlant, plantDefaultSpacingFt: null };
    renderBedGrid([noSpacingPlant]);
    await screen.findByTestId('placement-canvas');
    await user.click(screen.getByRole('button', { name: /click canvas/i }));
    await user.click(screen.getByRole('button', { name: /place plant-1/i }));
    await waitFor(() => {
      expect(mockCreatePlacement).toHaveBeenCalledWith(
        'garden-1', 'bed-1',
        expect.objectContaining({ width: 1.0, height: 1.0 }),
      );
    });
  });

  it('calls movePlacement (PATCH) when canvas onMove fires', async () => {
    const user = userEvent.setup();
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('canvas-item-pl-1');
    await user.click(screen.getByRole('button', { name: /drag pl-1/i }));
    await waitFor(() => {
      expect(mockMovePlacement).toHaveBeenCalledWith('garden-1', 'bed-1', 'pl-1', 3.0, 4.0);
    });
  });

  it('calls deletePlacement when canvas onRemove fires', async () => {
    const user = userEvent.setup();
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('canvas-item-pl-1');
    await user.click(screen.getByRole('button', { name: /delete pl-1/i }));
    await waitFor(() => {
      expect(mockDeletePlacement).toHaveBeenCalledWith('garden-1', 'bed-1', 'pl-1');
    });
  });
});
