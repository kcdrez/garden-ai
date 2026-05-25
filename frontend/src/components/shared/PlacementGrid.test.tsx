import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import PlacementGrid, { type GridPlacement } from './PlacementGrid';

const onEmptyCellClick = vi.fn();
const onRemove = vi.fn();

function renderGrid(
  overrides: Partial<{
    cols: number;
    rows: number;
    placements: GridPlacement[];
    isRemoving: boolean;
  }> = {},
) {
  const props = {
    cols: 2,
    rows: 2,
    placements: [],
    renderCell: (p: GridPlacement) => <span>{p.id}</span>,
    onEmptyCellClick,
    onRemove,
    ...overrides,
  };
  return render(<PlacementGrid {...props} />);
}

describe('PlacementGrid', () => {
  describe('empty grid', () => {
    it('renders an empty cell button for every cell', () => {
      renderGrid({ cols: 2, rows: 3 });
      expect(screen.getAllByRole('button', { name: /place at/i })).toHaveLength(6);
    });

    it('labels each cell with its 1-based column and row', () => {
      renderGrid({ cols: 2, rows: 2 });
      expect(screen.getByRole('button', { name: 'Place at column 1, row 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Place at column 2, row 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Place at column 1, row 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Place at column 2, row 2' })).toBeInTheDocument();
    });

    it('calls onEmptyCellClick with the correct 0-based coordinates', async () => {
      const user = userEvent.setup();
      renderGrid({ cols: 2, rows: 2 });

      await user.click(screen.getByRole('button', { name: 'Place at column 2, row 2' }));

      expect(onEmptyCellClick).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('with placements', () => {
    const placement: GridPlacement = { id: 'p1', x: 0, y: 0, width: 1, height: 1 };

    it('renders the cell content via renderCell', () => {
      renderGrid({ placements: [placement] });
      expect(screen.getByText('p1')).toBeInTheDocument();
    });

    it('replaces the occupied cell with the placement — no empty button at that position', () => {
      renderGrid({ cols: 2, rows: 2, placements: [placement] });
      expect(screen.queryByRole('button', { name: 'Place at column 1, row 1' })).not.toBeInTheDocument();
    });

    it('leaves the remaining cells as empty cell buttons', () => {
      renderGrid({ cols: 2, rows: 2, placements: [placement] });
      expect(screen.getAllByRole('button', { name: /place at/i })).toHaveLength(3);
    });

    it('calls onRemove with the placement id when the remove button is clicked', async () => {
      const user = userEvent.setup();
      renderGrid({ placements: [placement] });

      await user.click(screen.getByRole('button', { name: /remove from grid/i }));

      expect(onRemove).toHaveBeenCalledWith('p1');
    });

    it('disables the remove button when isRemoving is true', () => {
      renderGrid({ placements: [placement], isRemoving: true });
      expect(screen.getByRole('button', { name: /remove from grid/i })).toBeDisabled();
    });
  });

  describe('multi-cell placements', () => {
    it('renders only the origin cell for a spanning placement', () => {
      const wide: GridPlacement = { id: 'wide', x: 0, y: 0, width: 2, height: 1 };
      renderGrid({ cols: 2, rows: 2, placements: [wide] });

      expect(screen.getByText('wide')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /place at/i })).toHaveLength(2);
    });
  });
});
