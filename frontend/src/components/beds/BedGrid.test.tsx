import { render, screen, waitFor, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchPlacements, createPlacement, deletePlacement } from '@/api/plants';
import { mockBed, mockUserPlant } from '@/test/fixtures';
import type { GridPlacement } from '@/components/shared/PlacementGrid';
import BedGrid from './BedGrid';

const dndCallbacks = vi.hoisted(() => ({
  onDragStart: undefined as any,
  onDragEnd: undefined as any,
  onDragCancel: undefined as any,
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragStart, onDragEnd, onDragCancel }: any) => {
    dndCallbacks.onDragStart = onDragStart;
    dndCallbacks.onDragEnd = onDragEnd;
    dndCallbacks.onDragCancel = onDragCancel;
    return <>{children}</>;
  },
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
}));

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
  DraggableChip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
  vi.clearAllMocks();
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

describe('BedGrid - drag and drop', () => {
  it('calls createPlacement when an unplaced plant is dragged to a cell', async () => {
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'unplaced:plant-1' }, over: { id: 'cell:2,3' } });
    });

    await waitFor(() =>
      expect(createPlacement).toHaveBeenCalledWith('garden-1', 'bed-1', {
        userPlant: 'plant-1',
        x: 2,
        y: 3,
      }),
    );
  });

  it('does not call createPlacement when dropped outside the grid', async () => {
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'unplaced:plant-1' }, over: null });
    });

    expect(createPlacement).not.toHaveBeenCalled();
  });

  it('does not call createPlacement when dropped on a non-cell droppable', async () => {
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'unplaced:plant-1' }, over: { id: 'notcell:1,2' } });
    });

    expect(createPlacement).not.toHaveBeenCalled();
  });

  it('repositions a placed plant by deleting then creating at the new cell', async () => {
    vi.mocked(fetchPlacements).mockResolvedValue([mockPlacement]); // at x:0, y:0
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'placed:pl-1' }, over: { id: 'cell:2,3' } });
    });

    await waitFor(() =>
      expect(deletePlacement).toHaveBeenCalledWith('garden-1', 'bed-1', 'pl-1'),
    );
    await waitFor(() =>
      expect(createPlacement).toHaveBeenCalledWith('garden-1', 'bed-1', {
        userPlant: 'plant-1',
        x: 2,
        y: 3,
      }),
    );
  });

  it('does not move a placed plant when dropped on its current cell', async () => {
    vi.mocked(fetchPlacements).mockResolvedValue([mockPlacement]); // at x:0, y:0
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'placed:pl-1' }, over: { id: 'cell:0,0' } });
    });

    expect(deletePlacement).not.toHaveBeenCalled();
    expect(createPlacement).not.toHaveBeenCalled();
  });

  it('does not move when the placed drag target is not found in placements', async () => {
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragEnd({ active: { id: 'placed:nonexistent' }, over: { id: 'cell:2,3' } });
    });

    expect(deletePlacement).not.toHaveBeenCalled();
    expect(createPlacement).not.toHaveBeenCalled();
  });

  it('clears drag state on cancel', async () => {
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:plant-1' } });
    });
    act(() => {
      dndCallbacks.onDragCancel();
    });

    expect(screen.getByTestId('drag-overlay')).toBeEmptyDOMElement();
  });

  it('shows the unplaced plant name in the drag overlay while dragging', async () => {
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:plant-1' } });
    });

    expect(screen.getByTestId('drag-overlay')).toHaveTextContent('Tomato');
  });

  it('shows variety in the unplaced drag overlay when present', async () => {
    const plantWithVariety = { ...mockUserPlant, variety: 'Cherry' };
    render(
      <BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[plantWithVariety]} />,
    );
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:plant-1' } });
    });

    expect(screen.getByTestId('drag-overlay')).toHaveTextContent('Cherry');
  });

  it('shows nothing in the drag overlay when the unplaced plant is not found', async () => {
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'unplaced:nonexistent' } });
    });

    expect(screen.getByTestId('drag-overlay')).toBeEmptyDOMElement();
  });

  it('shows the placed plant name in the drag overlay when repositioning', async () => {
    vi.mocked(fetchPlacements).mockResolvedValue([mockPlacement]);
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'placed:pl-1' } });
    });

    expect(screen.getByTestId('drag-overlay')).toHaveTextContent('Tomato');
  });

  it('shows variety in the placed drag overlay when present', async () => {
    const plantWithVariety = { ...mockUserPlant, variety: 'Cherry' };
    vi.mocked(fetchPlacements).mockResolvedValue([mockPlacement]);
    render(
      <BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[plantWithVariety]} />,
    );
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'placed:pl-1' } });
    });

    expect(screen.getByTestId('drag-overlay')).toHaveTextContent('Cherry');
  });

  it('shows nothing in the drag overlay when placed placement is not found', async () => {
    render(<BedGrid gardenId="garden-1" bedId="bed-1" bed={mockBed} userPlants={[mockUserPlant]} />);
    await screen.findByTestId('placement-grid');

    act(() => {
      dndCallbacks.onDragStart({ active: { id: 'placed:nonexistent' } });
    });

    expect(screen.getByTestId('drag-overlay')).toBeEmptyDOMElement();
  });
});
