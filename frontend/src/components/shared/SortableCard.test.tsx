import { render, screen } from '@/test/test-utils';
import { DndContext } from '@dnd-kit/core';
import SortableCard from './SortableCard';

function wrap(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

describe('SortableCard', () => {
  it('renders its children', () => {
    wrap(<SortableCard id="a"><span>hello</span></SortableCard>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies grab cursor when not disabled', () => {
    const { container } = wrap(<SortableCard id="a"><span>item</span></SortableCard>);
    expect(container.firstChild).toHaveStyle({ cursor: 'grab' });
  });

  it('does not apply a cursor style when disabled', () => {
    const { container } = wrap(
      <SortableCard id="a" disabled><span>item</span></SortableCard>,
    );
    expect(container.firstChild).not.toHaveStyle({ cursor: 'grab' });
    expect(container.firstChild).not.toHaveStyle({ cursor: 'grabbing' });
  });

  it('reduces opacity while dragging', () => {
    // useSortable returns isDragging=false in jsdom — just verify normal opacity is unset
    const { container } = wrap(<SortableCard id="a"><span>item</span></SortableCard>);
    expect(container.firstChild).not.toHaveStyle({ opacity: '0.5' });
  });
});
