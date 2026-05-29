import type { ReactNode } from 'react';
import { render, screen } from '@/test/test-utils';
import type { DragEndEvent } from '@dnd-kit/core';
import SortableGrid from './SortableGrid';

// Capture onDragEnd so tests can trigger it directly
let capturedOnDragEnd: ((e: DragEndEvent) => void) | undefined;

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: { children: ReactNode; onDragEnd: (e: DragEndEvent) => void }) => {
    capturedOnDragEnd = onDragEnd;
    return <div>{children}</div>;
  },
  closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  rectSortingStrategy: vi.fn(),
}));

vi.mock('@/components/shared/SortableCard', () => ({
  default: ({ id, disabled, children }: { id: string; disabled?: boolean; children: ReactNode }) => (
    <div data-testid={`card-${id}`} data-disabled={String(disabled)}>
      {children}
    </div>
  ),
}));

const items = [
  { id: '1', name: 'Alpha', createdAt: '2024-01-01' },
  { id: '2', name: 'Beta', createdAt: '2024-01-02' },
];

beforeEach(() => {
  capturedOnDragEnd = undefined;
});

describe('SortableGrid', () => {
  it('renders all items via renderItem', () => {
    render(
      <SortableGrid
        items={items}
        sortMode="name-asc"
        onReorder={vi.fn()}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('disables SortableCard when sortMode is not custom', () => {
    render(
      <SortableGrid
        items={items}
        sortMode="name-asc"
        onReorder={vi.fn()}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );
    expect(screen.getByTestId('card-1')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('card-2')).toHaveAttribute('data-disabled', 'true');
  });

  it('enables SortableCard when sortMode is custom', () => {
    render(
      <SortableGrid
        items={items}
        sortMode="custom"
        onReorder={vi.fn()}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );
    expect(screen.getByTestId('card-1')).toHaveAttribute('data-disabled', 'false');
    expect(screen.getByTestId('card-2')).toHaveAttribute('data-disabled', 'false');
  });

  it('calls onReorder with active and over ids when drag ends on a different item', () => {
    const onReorder = vi.fn();
    render(
      <SortableGrid
        items={items}
        sortMode="custom"
        onReorder={onReorder}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );

    capturedOnDragEnd?.({ active: { id: '1' }, over: { id: '2' } } as DragEndEvent);

    expect(onReorder).toHaveBeenCalledWith('1', '2');
  });

  it('does not call onReorder when dragged onto itself', () => {
    const onReorder = vi.fn();
    render(
      <SortableGrid
        items={items}
        sortMode="custom"
        onReorder={onReorder}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );

    capturedOnDragEnd?.({ active: { id: '1' }, over: { id: '1' } } as DragEndEvent);

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('does not call onReorder when dropped outside any item', () => {
    const onReorder = vi.fn();
    render(
      <SortableGrid
        items={items}
        sortMode="custom"
        onReorder={onReorder}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );

    capturedOnDragEnd?.({ active: { id: '1' }, over: null } as DragEndEvent);

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('applies a custom className to the grid container', () => {
    const { container } = render(
      <SortableGrid
        items={items}
        sortMode="name-asc"
        onReorder={vi.fn()}
        renderItem={(item) => <span>{item.name}</span>}
        className="my-custom-class"
      />,
    );
    expect(container.querySelector('.my-custom-class')).toBeInTheDocument();
  });
});
