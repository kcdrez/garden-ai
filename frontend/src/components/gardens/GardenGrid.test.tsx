import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchBedPlacements, createBedPlacement, deleteBedPlacement } from '@/api/beds';
import { mockGarden, mockBed } from '@/test/fixtures';
import type { GridPlacement } from '@/components/shared/PlacementGrid';
import GardenGrid from './GardenGrid';

vi.mock('@/api/beds', () => ({
  fetchBedPlacements: vi.fn(),
  createBedPlacement: vi.fn().mockResolvedValue({}),
  deleteBedPlacement: vi.fn(),
}));

vi.mock('@/components/shared/PlacementGrid', () => ({
  default: ({
    cols,
    rows,
    placements,
    onEmptyCellClick,
    onRemove,
    renderCell,
  }: {
    cols: number;
    rows: number;
    placements: GridPlacement[];
    onEmptyCellClick: (x: number, y: number) => void;
    onRemove: (id: string) => void;
    renderCell: (p: GridPlacement) => React.ReactNode;
  }) => (
    <div data-testid="placement-grid" data-cols={cols} data-rows={rows}>
      <button onClick={() => onEmptyCellClick(0, 0)}>Click cell</button>
      {placements.map((p) => (
        <div key={p.id}>
          <button onClick={() => onRemove(p.id)}>Remove {p.id}</button>
          <div data-testid={`cell-${p.id}`}>{renderCell(p)}</div>
        </div>
      ))}
    </div>
  ),
  DraggableChip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/gardens/PlaceBedDialog', () => ({
  default: ({
    open,
    onOpenChange,
    onPlace,
    unplacedBeds,
    placeableBedIds,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPlace: (bedId: string) => void;
    unplacedBeds: { id: string; name: string }[];
    placeableBedIds: Set<string>;
  }) =>
    open ? (
      <div role="dialog" aria-label="Place Bed">
        <button onClick={() => onOpenChange(false)}>Cancel</button>
        {unplacedBeds
          .filter((b) => placeableBedIds.has(b.id))
          .map((b) => (
            <button key={b.id} onClick={() => onPlace(b.id)}>
              Place {b.name}
            </button>
          ))}
      </div>
    ) : null,
}));

const gardenWithDims = { ...mockGarden, length: 10, width: 8 };

const mockBedPlacement = {
  id: 'bp-1',
  bed: 'bed-1',
  garden: 'garden-1',
  x: 0,
  y: 0,
  width: 4,
  height: 4,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.mocked(fetchBedPlacements).mockResolvedValue([]);
  vi.mocked(deleteBedPlacement).mockResolvedValue(undefined);
});

describe('GardenGrid', () => {
  it('renders nothing when the garden has no dimensions', async () => {
    const { container } = render(
      <GardenGrid gardenId="garden-1" garden={mockGarden} beds={[]} />,
    );
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('shows a loading spinner while placements load', () => {
    vi.mocked(fetchBedPlacements).mockImplementation(() => new Promise(() => {}));
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[]} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders PlacementGrid with dimensions derived from the garden', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[]} />);
    const grid = await screen.findByTestId('placement-grid');
    // width 8 ft → 8 cols, length 10 ft → 10 rows
    expect(grid).toHaveAttribute('data-cols', '8');
    expect(grid).toHaveAttribute('data-rows', '10');
  });

  it('opens the place bed dialog when an empty cell is clicked', async () => {
    const user = userEvent.setup();
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /click cell/i }));

    expect(screen.getByRole('dialog', { name: /place bed/i })).toBeInTheDocument();
  });

  it('calls deleteBedPlacement when a placement is removed', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchBedPlacements).mockResolvedValue([mockBedPlacement]);
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /remove bp-1/i }));

    await waitFor(() =>
      expect(deleteBedPlacement).toHaveBeenCalledWith('garden-1', 'bp-1'),
    );
  });

  it('renders bed name and plant count inside a placed cell', async () => {
    const bedWithPlants = { ...mockBed, plantCount: 2 };
    vi.mocked(fetchBedPlacements).mockResolvedValue([mockBedPlacement]);
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[bedWithPlants]} />);
    await screen.findByTestId('placement-grid');

    expect(screen.getByText('Raised Bed 1')).toBeInTheDocument();
    expect(screen.getByText('2 plants')).toBeInTheDocument();
  });

  it('renders singular "plant" when plantCount is 1', async () => {
    const bedWithOnePlant = { ...mockBed, plantCount: 1 };
    vi.mocked(fetchBedPlacements).mockResolvedValue([mockBedPlacement]);
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[bedWithOnePlant]} />);
    await screen.findByTestId('placement-grid');

    expect(screen.getByText('1 plant')).toBeInTheDocument();
  });

  it('calls createBedPlacement when a bed is placed via the dialog', async () => {
    const user = userEvent.setup();
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /click cell/i }));
    await user.click(screen.getByRole('button', { name: /place raised bed 1/i }));

    await waitFor(() =>
      expect(createBedPlacement).toHaveBeenCalledWith(
        'garden-1',
        expect.objectContaining({ bed: 'bed-1', x: 0, y: 0 }),
      ),
    );
  });

  it('closes the dialog when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /click cell/i }));
    expect(screen.getByRole('dialog', { name: /place bed/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('excludes beds that would not fit at the selected cell', async () => {
    const user = userEvent.setup();
    // A 2x2 garden cannot fit a 4x4 bed
    const tinyGarden = { ...mockGarden, length: 2, width: 2 };
    render(<GardenGrid gardenId="garden-1" garden={tinyGarden} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /click cell/i }));

    expect(screen.queryByRole('button', { name: /place raised bed 1/i })).not.toBeInTheDocument();
  });
});
