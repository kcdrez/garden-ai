import { render, screen } from '@/test/test-utils';
import { mockUserPlant } from '@/test/fixtures';
import PlantObservationsSheet from './PlantObservationsSheet';

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div>{children}</div> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/plants/PlantTimeline', () => ({
  default: () => <div data-testid="plant-timeline" />,
}));

const defaultProps = {
  plant: mockUserPlant,
  gardenId: 'garden-1',
  bedId: 'bed-1',
  open: true,
  onOpenChange: vi.fn(),
};

describe('PlantObservationsSheet', () => {
  it('renders the plant name as the title', () => {
    render(<PlantObservationsSheet {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Tomato' })).toBeInTheDocument();
  });

  it('includes the variety in the title when present', () => {
    const plant = { ...mockUserPlant, variety: 'Cherokee Purple' };
    render(<PlantObservationsSheet {...defaultProps} plant={plant} />);
    expect(screen.getByRole('heading', { name: 'Tomato — Cherokee Purple' })).toBeInTheDocument();
  });

  it('renders the PlantTimeline', () => {
    render(<PlantObservationsSheet {...defaultProps} />);
    expect(screen.getByTestId('plant-timeline')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(<PlantObservationsSheet {...defaultProps} open={false} />);
    expect(screen.queryByTestId('plant-timeline')).not.toBeInTheDocument();
  });
});
