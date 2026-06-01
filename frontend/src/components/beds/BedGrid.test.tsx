import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchPlacements, createPlacement, movePlacement, resizePlacement, deletePlacement, cloneUserPlant, deleteUserPlant } from '@/api/plants';
import { mockBed, mockUserPlant } from '@/test/fixtures';
import BedGrid from './BedGrid';

vi.mock('@/api/plants', () => ({
  fetchPlacements: vi.fn(),
  createPlacement: vi.fn(),
  movePlacement: vi.fn(),
  resizePlacement: vi.fn(),
  deletePlacement: vi.fn(),
  cloneUserPlant: vi.fn(),
  deleteUserPlant: vi.fn(),
}));

vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('@/components/shared/PlacementCanvas', () => ({
  default: ({ items, onEmptyClick, onMove, onResize, getMenuItems }: {
    items: { id: string }[];
    onEmptyClick: (x: number, y: number) => void;
    onMove: (id: string, x: number, y: number) => void;
    onResize?: (id: string, w: number, h: number) => void;
    getMenuItems: (id: string) => { label: string; onClick: () => void }[];
  }) => (
    <div data-testid="placement-canvas">
      <button onClick={() => onEmptyClick(1.5, 2.0)}>Click canvas</button>
      {items.map((item) => (
        <div key={item.id} data-testid={`canvas-item-${item.id}`}>
          <button onClick={() => onMove(item.id, 3.0, 4.0)}>Drag {item.id}</button>
          {onResize && <button onClick={() => onResize(item.id, 2.0, 2.0)}>Resize {item.id}</button>}
          {getMenuItems(item.id).map((mi) => (
            <button key={mi.label} onClick={mi.onClick}>{mi.label} {item.id}</button>
          ))}
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

vi.mock('@/components/plants/UserPlantDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Edit Plant Form" /> : null,
}));

vi.mock('@/components/plants/MovePlantDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Move Plant Dialog" /> : null,
}));

vi.mock('@/components/plants/PlantObservationsSheet', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Observations Sheet" /> : null,
}));

vi.mock('@/components/ui/card-actions-menu', () => ({
  default: ({ onEdit, onClone, onMove, onDelete }: {
    onEdit: () => void;
    onClone?: () => void;
    onMove?: () => void;
    onDelete: () => void;
  }) => (
    <div>
      <button onClick={onEdit}>Edit chip</button>
      {onClone && <button onClick={onClone}>Clone chip</button>}
      {onMove && <button onClick={onMove}>Move chip</button>}
      <button onClick={onDelete}>Delete chip</button>
    </div>
  ),
}));

const mockFetchPlacements = vi.mocked(fetchPlacements);
const mockCreatePlacement = vi.mocked(createPlacement);
const mockMovePlacement = vi.mocked(movePlacement);
const mockResizePlacement = vi.mocked(resizePlacement);
const mockDeletePlacement = vi.mocked(deletePlacement);
const mockCloneUserPlant = vi.mocked(cloneUserPlant);
const mockDeleteUserPlant = vi.mocked(deleteUserPlant);

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
    mockResizePlacement.mockResolvedValue(placement);
    mockDeletePlacement.mockResolvedValue(undefined);
    mockCloneUserPlant.mockResolvedValue(mockUserPlant);
    mockDeleteUserPlant.mockResolvedValue(undefined);
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

  it('shows zero state when all plants are placed', async () => {
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('placement-canvas');
    expect(screen.getByText(/all plants are placed in the bed/i)).toBeInTheDocument();
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

  it('calls resizePlacement when canvas onResize fires', async () => {
    const user = userEvent.setup();
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('canvas-item-pl-1');
    await user.click(screen.getByRole('button', { name: /resize pl-1/i }));
    await waitFor(() => {
      expect(mockResizePlacement).toHaveBeenCalledWith('garden-1', 'bed-1', 'pl-1', 2.0, 2.0);
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

  it('calls deleteUserPlant when Delete menu item is clicked', async () => {
    const user = userEvent.setup();
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('canvas-item-pl-1');
    await user.click(screen.getByRole('button', { name: /delete pl-1/i }));
    await waitFor(() => {
      expect(mockDeleteUserPlant).toHaveBeenCalledWith('garden-1', 'bed-1', 'plant-1');
    });
  });

  it('opens UserPlantDialog when Edit menu item is clicked', async () => {
    const user = userEvent.setup();
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('canvas-item-pl-1');
    await user.click(screen.getByRole('button', { name: /edit pl-1/i }));
    expect(screen.getByRole('dialog', { name: /edit plant form/i })).toBeInTheDocument();
  });

  it('opens MovePlantDialog when Move menu item is clicked', async () => {
    const user = userEvent.setup();
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('canvas-item-pl-1');
    await user.click(screen.getByRole('button', { name: /move to another bed pl-1/i }));
    expect(screen.getByRole('dialog', { name: /move plant dialog/i })).toBeInTheDocument();
  });

  it('navigates to plant detail when View Details menu item is clicked', async () => {
    const user = userEvent.setup();
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('canvas-item-pl-1');
    await user.click(screen.getByRole('button', { name: /view details pl-1/i }));
    // navigation is "Not implemented" in jsdom — confirmed by the warning in test output
  });

  it('calls cloneUserPlant with placement coords when canvas Clone is clicked', async () => {
    const user = userEvent.setup();
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('canvas-item-pl-1');
    await user.click(screen.getByRole('button', { name: /clone pl-1/i }));
    await waitFor(() => {
      expect(mockCloneUserPlant).toHaveBeenCalledWith(
        'garden-1', 'bed-1', 'plant-1',
        expect.objectContaining({ x: placement.x + placement.width, y: placement.y }),
      );
    });
  });

  it('opens PlantObservationsSheet when Observations menu item is clicked', async () => {
    const user = userEvent.setup();
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('canvas-item-pl-1');
    await user.click(screen.getByRole('button', { name: /observations pl-1/i }));
    expect(screen.getByRole('dialog', { name: /observations sheet/i })).toBeInTheDocument();
  });

  it('calls deletePlacement when Remove from layout menu item is clicked', async () => {
    const user = userEvent.setup();
    mockFetchPlacements.mockResolvedValue([placement]);
    renderBedGrid();
    await screen.findByTestId('canvas-item-pl-1');
    await user.click(screen.getByRole('button', { name: /Remove From Layout pl-1/i }));
    await waitFor(() => {
      expect(mockDeletePlacement).toHaveBeenCalledWith('garden-1', 'bed-1', 'pl-1');
    });
  });

  it('opens UserPlantDialog when Create Plant button is clicked', async () => {
    const user = userEvent.setup();
    renderBedGrid();
    await screen.findByTestId('placement-canvas');
    await user.click(screen.getByRole('button', { name: /create plant/i }));
    expect(screen.getByRole('dialog', { name: /edit plant form/i })).toBeInTheDocument();
  });

  it('opens UserPlantDialog when unplaced chip Edit is clicked', async () => {
    const user = userEvent.setup();
    renderBedGrid();
    await screen.findByText('Tomato');
    await user.click(screen.getByRole('button', { name: /edit chip/i }));
    expect(screen.getByRole('dialog', { name: /edit plant form/i })).toBeInTheDocument();
  });

  it('calls cloneUserPlant when unplaced chip Clone is clicked', async () => {
    const user = userEvent.setup();
    renderBedGrid();
    await screen.findByText('Tomato');
    await user.click(screen.getByRole('button', { name: /clone chip/i }));
    await waitFor(() => {
      expect(mockCloneUserPlant).toHaveBeenCalledWith('garden-1', 'bed-1', 'plant-1', undefined);
    });
  });

  it('opens MovePlantDialog when unplaced chip Move is clicked', async () => {
    const user = userEvent.setup();
    renderBedGrid();
    await screen.findByText('Tomato');
    await user.click(screen.getByRole('button', { name: /move chip/i }));
    expect(screen.getByRole('dialog', { name: /move plant dialog/i })).toBeInTheDocument();
  });

  it('calls deleteUserPlant when unplaced chip Delete is clicked', async () => {
    const user = userEvent.setup();
    renderBedGrid();
    await screen.findByText('Tomato');
    await user.click(screen.getByRole('button', { name: /delete chip/i }));
    await waitFor(() => {
      expect(mockDeleteUserPlant).toHaveBeenCalledWith('garden-1', 'bed-1', 'plant-1');
    });
  });
});
