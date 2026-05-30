import { render, screen } from '@/test/test-utils';
import { mockBeds } from '@/test/fixtures';
import type { GardenBed } from '@/types/gardens';
import BedGroupSection from './BedGroupSection';

vi.mock('@/components/beds/BedItem', () => ({
  default: ({ bed }: { bed: GardenBed }) => <div data-testid="bed-item">{bed.name}</div>,
}));

vi.mock('@/components/shared/SortableGrid', () => ({
  default: ({ items, renderItem }: { items: GardenBed[]; renderItem: (b: GardenBed) => React.ReactNode }) => (
    <div data-testid="sortable-grid">{items.map(renderItem)}</div>
  ),
}));

const g1Beds = mockBeds.filter((b) => b.garden === 'garden-1');

describe('BedGroupSection', () => {
  it('renders the garden name as a heading', () => {
    render(
      <BedGroupSection
        gardenId="garden-1"
        gardenName="Front Yard"
        beds={g1Beds}
        sortMode="name-asc"
        onReorder={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Front Yard' })).toBeInTheDocument();
  });

  it('renders a "View garden" link pointing to the garden detail route', () => {
    render(
      <BedGroupSection
        gardenId="garden-1"
        gardenName="Front Yard"
        beds={g1Beds}
        sortMode="name-asc"
        onReorder={vi.fn()}
      />,
    );
    const link = screen.getByRole('link', { name: /view garden/i });
    expect(link).toHaveAttribute('href', '/gardens/garden-1');
  });

  it('renders all bed items via SortableGrid', () => {
    render(
      <BedGroupSection
        gardenId="garden-1"
        gardenName="Front Yard"
        beds={g1Beds}
        sortMode="name-asc"
        onReorder={vi.fn()}
      />,
    );
    expect(screen.getByTestId('sortable-grid')).toBeInTheDocument();
    expect(screen.getAllByTestId('bed-item')).toHaveLength(g1Beds.length);
  });
});
