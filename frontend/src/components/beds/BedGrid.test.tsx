import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchPlacements, createPlacement, deletePlacement } from '@/api/plants';
import { mockBed, mockUserPlant } from '@/test/fixtures';
import type { GridPlacement } from '@/components/shared/PlacementGrid';
import BedGrid from './BedGrid';

vi.mock('@/api/plants', () => ({
  fetchPlacements: vi.fn(),
  createPlacement: vi.fn(),
  deletePlacement: vi.fn(),
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
      <button onClick={() => onEmptyCellClick(1, 2)}>Click cell</button>
      {placements.map((p) => (
        <div key={p.id}>
          <button onClick={() => onRemove(p.id)}>Remove {p.id}</button>
          <div data-testid={`cell-${p.id}`}>{renderCell(p)}</div>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/plants/PlacePlantDialog', () => ({
  default: ({
    open,
    onOpenChange,
    onPlace,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPlace: (plantId: string) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Place Plant">
        <button onClick={() => onPlace('plant-1')}>Place</button>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    ) : null,
}));

const mockPlacement = {
  id: 'pl-1',
  userPlant: 'plant-1',
  bed: 'bed-1',
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.mocked(fetchPlacements).mockResolvedValue([]);
  vi.mocked(createPlacement).mockResolvedValue(mockPlacement);
  vi.mocked(deletePlacement).mockResolvedValue(undefined);
});

describe('BedGrid', () => {
  it('shows a loading spinner while placements load', () => {
    vi.mocked(fetchPlacements).mockImplementation(() => new Promise(() => {}));
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[]} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders PlacementGrid with dimensions derived from the bed', async () => {
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[]} />);
    const grid = await screen.findByTestId('placement-grid');
    // mockBed is 4 × 4 ft → 4 cols, 4 rows
    expect(grid).toHaveAttribute('data-cols', '4');
    expect(grid).toHaveAttribute('data-rows', '4');
  });

  it('opens the place plant dialog when an empty cell is clicked', async () => {
    const user = userEvent.setup();
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /click cell/i }));

    expect(screen.getByRole('dialog', { name: /place plant/i })).toBeInTheDocument();
  });

  it('calls createPlacement with the cell coordinates when a plant is placed', async () => {
    const user = userEvent.setup();
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /click cell/i }));
    await user.click(screen.getByRole('button', { name: /^place$/i }));

    await waitFor(() =>
      expect(createPlacement).toHaveBeenCalledWith('garden-1', 'bed-1', {
        userPlant: 'plant-1',
        x: 1,
        y: 2,
      }),
    );
  });

  it('closes the dialog after a plant is placed', async () => {
    const user = userEvent.setup();
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /click cell/i }));
    await user.click(screen.getByRole('button', { name: /^place$/i }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('calls deletePlacement when a placement is removed', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchPlacements).mockResolvedValue([mockPlacement]);
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /remove pl-1/i }));

    await waitFor(() =>
      expect(deletePlacement).toHaveBeenCalledWith('garden-1', 'bed-1', 'pl-1'),
    );
  });

  it('renders plant name inside a placed cell', async () => {
    vi.mocked(fetchPlacements).mockResolvedValue([mockPlacement]);
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    expect(screen.getByText('Tomato')).toBeInTheDocument();
  });

  it('renders plant variety inside a placed cell when present', async () => {
    const plantWithVariety = { ...mockUserPlant, variety: 'Cherry' };
    vi.mocked(fetchPlacements).mockResolvedValue([mockPlacement]);
    render(
      <BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[plantWithVariety]} />,
    );
    await screen.findByTestId('placement-grid');

    expect(screen.getByText('Cherry')).toBeInTheDocument();
  });

  it('renders an empty cell when no matching userPlant is found', async () => {
    vi.mocked(fetchPlacements).mockResolvedValue([mockPlacement]);
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[]} />);

    const cell = await screen.findByTestId('cell-pl-1');
    expect(cell).toBeInTheDocument();
  });

  it('closes the dialog when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /click cell/i }));
    expect(screen.getByRole('dialog', { name: /place plant/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
