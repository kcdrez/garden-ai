import { render, screen, waitFor, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchBedPlacements, createBedPlacement, deleteBedPlacement } from '@/api/beds';
import { mockGarden, mockBed } from '@/test/fixtures';
import type { GridPlacement } from '@/components/shared/PlacementGrid';
import GardenGrid from './GardenGrid';

const dndCallbacks = vi.hoisted(() => ({
  onDragStart: undefined as any,
  onDragEnd: undefined as any,
  onDragCancel: undefined as any,
  onDragOver: undefined as any,
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragStart, onDragEnd, onDragCancel, onDragOver }: any) => {
    dndCallbacks.onDragStart = onDragStart;
    dndCallbacks.onDragEnd = onDragEnd;
    dndCallbacks.onDragCancel = onDragCancel;
    dndCallbacks.onDragOver = onDragOver;
    return <>{children}</>;
  },
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
}));

vi.mock('@/api/beds', () => ({
  fetchBedPlacements: vi.fn(),
  createBedPlacement: vi.fn(),
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
    getDropState,
  }: {
    cols: number;
    rows: number;
    placements: GridPlacement[];
    onEmptyCellClick: (x: number, y: number) => void;
    onRemove: (id: string) => void;
    renderCell: (p: GridPlacement) => React.ReactNode;
    getDropState?: (x: number, y: number) => 'valid' | 'invalid' | null;
  }) => (
    <div data-testid="placement-grid" data-cols={cols} data-rows={rows}>
      <button onClick={() => onEmptyCellClick(0, 0)}>Click cell</button>
      {getDropState && (
        <>
          <div data-testid="drop-state-0-0">{getDropState(0, 0) ?? 'none'}</div>
          <div data-testid="drop-state-5-0">{getDropState(5, 0) ?? 'none'}</div>
        </>
      )}
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
  vi.clearAllMocks();
  vi.mocked(fetchBedPlacements).mockResolvedValue([]);
  vi.mocked(createBedPlacement).mockResolvedValue({} as any);
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

describe('GardenGrid - drag and drop', () => {
  it('calls createBedPlacement when an unplaced bed is dragged to a valid cell', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'unplaced:bed-1' }, over: { id: 'cell:0,0' } });
    });

    await waitFor(() =>
      expect(createBedPlacement).toHaveBeenCalledWith(
        'garden-1',
        expect.objectContaining({ bed: 'bed-1', x: 0, y: 0 }),
      ),
    );
  });

  it('does not call createBedPlacement when the bed does not fit at the drop cell', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    // gardenWithDims is 8 cols wide, mockBed is 4 cols wide. At col 6: 6+4=10 > 8
    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'unplaced:bed-1' }, over: { id: 'cell:6,0' } });
    });

    expect(createBedPlacement).not.toHaveBeenCalled();
  });

  it('does not call createBedPlacement when dropped outside the grid', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'unplaced:bed-1' }, over: null });
    });

    expect(createBedPlacement).not.toHaveBeenCalled();
  });

  it('does not call createBedPlacement when dropped on a non-cell droppable', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'unplaced:bed-1' }, over: { id: 'notcell:0,0' } });
    });

    expect(createBedPlacement).not.toHaveBeenCalled();
  });

  it('does not call createBedPlacement when bed id is not in the beds list', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'unplaced:bed-1' }, over: { id: 'cell:0,0' } });
    });

    expect(createBedPlacement).not.toHaveBeenCalled();
  });

  it('repositions a placed bed by deleting then creating at the new cell', async () => {
    vi.mocked(fetchBedPlacements).mockResolvedValue([mockBedPlacement]); // at x:0, y:0
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'placed:bp-1' }, over: { id: 'cell:4,4' } });
    });

    await waitFor(() =>
      expect(deleteBedPlacement).toHaveBeenCalledWith('garden-1', 'bp-1'),
    );
    await waitFor(() =>
      expect(createBedPlacement).toHaveBeenCalledWith(
        'garden-1',
        expect.objectContaining({ bed: 'bed-1', x: 4, y: 4 }),
      ),
    );
  });

  it('does not reposition a placed bed when dropped on its current cell', async () => {
    vi.mocked(fetchBedPlacements).mockResolvedValue([mockBedPlacement]); // at x:0, y:0
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'placed:bp-1' }, over: { id: 'cell:0,0' } });
    });

    expect(deleteBedPlacement).not.toHaveBeenCalled();
    expect(createBedPlacement).not.toHaveBeenCalled();
  });

  it('does not reposition when placed drag target is not found in placements', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'placed:nonexistent' }, over: { id: 'cell:2,2' } });
    });

    expect(deleteBedPlacement).not.toHaveBeenCalled();
    expect(createBedPlacement).not.toHaveBeenCalled();
  });

  it('does not reposition a placed bed when it does not fit at the new cell', async () => {
    vi.mocked(fetchBedPlacements).mockResolvedValue([mockBedPlacement]); // at x:0, y:0
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    // 4x4 bed at col 6: 6+4=10 > 8 cols
    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'placed:bp-1' }, over: { id: 'cell:6,0' } });
    });

    expect(deleteBedPlacement).not.toHaveBeenCalled();
    expect(createBedPlacement).not.toHaveBeenCalled();
  });

  it('shows the unplaced bed name in the drag overlay while dragging', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:bed-1' } });
    });

    expect(screen.getByTestId('drag-overlay')).toHaveTextContent('Raised Bed 1');
  });

  it('shows nothing in the drag overlay when the unplaced bed id is not found', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:nonexistent' } });
    });

    expect(screen.getByTestId('drag-overlay')).toBeEmptyDOMElement();
  });

  it('shows the placed bed name in the drag overlay when repositioning', async () => {
    vi.mocked(fetchBedPlacements).mockResolvedValue([mockBedPlacement]);
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'placed:bp-1' } });
    });

    expect(screen.getByTestId('drag-overlay')).toHaveTextContent('Raised Bed 1');
  });

  it('shows nothing in the drag overlay when placed placement has no matching bed', async () => {
    vi.mocked(fetchBedPlacements).mockResolvedValue([mockBedPlacement]);
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'placed:bp-1' } });
    });

    expect(screen.getByTestId('drag-overlay')).toBeEmptyDOMElement();
  });

  it('clears drag state and overCell on cancel', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:bed-1' } });
    });
    act(() => {
      dndCallbacks.onDragCancel();
    });

    expect(screen.getByTestId('drag-overlay')).toBeEmptyDOMElement();
  });

  it('clears drag state when drag ends', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:bed-1' } });
    });
    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'unplaced:bed-1' }, over: null });
    });

    expect(screen.getByTestId('drag-overlay')).toBeEmptyDOMElement();
  });
});

describe('GardenGrid - getDropState', () => {
  it('does not pass getDropState to PlacementGrid when no drag is active', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    expect(screen.queryByTestId('drop-state-0-0')).not.toBeInTheDocument();
  });

  it('shows valid drop state when dragging an unplaced bed over a fitting cell', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:bed-1' } });
    });
    // mockBed is 4x4 ft. At (0,0) it fits in 8x10 garden; cell (0,0) is in its footprint
    act(() => {
      dndCallbacks.onDragOver({ over: { id: 'cell:0,0' } });
    });

    expect(screen.getByTestId('drop-state-0-0')).toHaveTextContent('valid');
  });

  it('shows invalid drop state when the bed would go out of bounds', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:bed-1' } });
    });
    // 4x4 bed at (5,0): 5+4=9 > 8 cols → invalid. Cell (5,0) is within the footprint
    act(() => {
      dndCallbacks.onDragOver({ over: { id: 'cell:5,0' } });
    });

    expect(screen.getByTestId('drop-state-5-0')).toHaveTextContent('invalid');
  });

  it('returns null for cells not in the drag footprint', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:bed-1' } });
    });
    // Hovering over (5,0) — cell (0,0) is NOT in the footprint of a bed placed at (5,0)
    act(() => {
      dndCallbacks.onDragOver({ over: { id: 'cell:5,0' } });
    });

    expect(screen.getByTestId('drop-state-0-0')).toHaveTextContent('none');
  });

  it('returns null when overCell does not start with "cell:"', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:bed-1' } });
    });
    act(() => {
      dndCallbacks.onDragOver({ over: { id: 'notcell:0,0' } });
    });

    expect(screen.getByTestId('drop-state-0-0')).toHaveTextContent('none');
    expect(screen.getByTestId('drop-state-5-0')).toHaveTextContent('none');
  });

  it('returns null when overCell is cleared', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:bed-1' } });
    });
    act(() => {
      dndCallbacks.onDragOver({ over: null });
    });

    expect(screen.getByTestId('drop-state-0-0')).toHaveTextContent('none');
  });

  it('returns null when bedId is not found in beds', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:nonexistent' } });
    });
    act(() => {
      dndCallbacks.onDragOver({ over: { id: 'cell:0,0' } });
    });

    expect(screen.getByTestId('drop-state-0-0')).toHaveTextContent('none');
  });

  it('returns valid when repositioning a placed bed to a free cell', async () => {
    vi.mocked(fetchBedPlacements).mockResolvedValue([mockBedPlacement]); // bp-1 at (0,0)
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'placed:bp-1' } });
    });
    // Hover over (0,0); bp-1 is excluded so its own cells count as free
    act(() => {
      dndCallbacks.onDragOver({ over: { id: 'cell:0,0' } });
    });

    expect(screen.getByTestId('drop-state-0-0')).toHaveTextContent('valid');
  });

  it('returns null when placed placement id is not found (bedId becomes undefined)', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'placed:nonexistent' } });
    });
    act(() => {
      dndCallbacks.onDragOver({ over: { id: 'cell:0,0' } });
    });

    // existing = undefined → bedId = undefined → !bedId → null
    expect(screen.getByTestId('drop-state-0-0')).toHaveTextContent('none');
  });
});
