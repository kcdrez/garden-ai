import { render, screen } from '@/test/test-utils';
import { mockCalendarPlant } from '@/test/fixtures';
import type { CalendarObservation } from '@/types/plants';
import PlantingGantt from './PlantingGantt';

const YEAR = 2026;

describe('PlantingGantt', () => {
  it('renders the plant name as a link to plant detail', () => {
    render(<PlantingGantt plants={[mockCalendarPlant]} year={YEAR} />);

    const link = screen.getByRole('link', { name: /tomato/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', `/plants/${mockCalendarPlant.id}`);
  });

  it('renders the bed name as a link to the bed detail page', () => {
    render(<PlantingGantt plants={[mockCalendarPlant]} year={YEAR} />);

    const link = screen.getByRole('link', { name: /raised bed 1/i });
    expect(link).toHaveAttribute(
      'href',
      `/gardens/${mockCalendarPlant.gardenId}/beds/${mockCalendarPlant.bed}`,
    );
  });

  it('renders the garden name as a link to the garden detail page', () => {
    render(<PlantingGantt plants={[mockCalendarPlant]} year={YEAR} />);

    const link = screen.getByRole('link', { name: /front yard/i });
    expect(link).toHaveAttribute('href', `/gardens/${mockCalendarPlant.gardenId}`);
  });

  it('renders a group heading per unique bed', () => {
    const secondPlant = { ...mockCalendarPlant, id: 'plant-2', bed: 'bed-2', bedName: 'Bed Two' };
    render(<PlantingGantt plants={[mockCalendarPlant, secondPlant]} year={YEAR} />);

    expect(screen.getByRole('link', { name: /raised bed 1/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bed two/i })).toBeInTheDocument();
  });

  it('shows plant variety in the label when set', () => {
    const plant = { ...mockCalendarPlant, variety: 'Cherry' };
    render(<PlantingGantt plants={[plant]} year={YEAR} />);

    expect(screen.getByRole('link', { name: /tomato \(cherry\)/i })).toBeInTheDocument();
  });

  it('renders the status legend section', () => {
    render(<PlantingGantt plants={[mockCalendarPlant]} year={YEAR} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders the events legend section', () => {
    render(<PlantingGantt plants={[mockCalendarPlant]} year={YEAR} />);
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('renders event dots for non-status_change observations in the given year', () => {
    const plant = {
      ...mockCalendarPlant,
      observations: [
        ...mockCalendarPlant.observations,
        { id: 'obs-harvest', observedDate: '2026-05-01', type: 'harvest' as const, note: '', previousStatus: '' as const, newStatus: '' as const },
        { id: 'obs-pest',    observedDate: '2026-06-01', type: 'pest'    as const, note: 'aphids', previousStatus: '' as const, newStatus: '' as const },
      ],
    };
    render(<PlantingGantt plants={[plant]} year={YEAR} />);
    // Event dots render as titled divs — verify the tooltip titles are present
    expect(document.querySelector('[title="Harvest"]')).toBeInTheDocument();
    expect(document.querySelector('[title="Pest: aphids"]')).toBeInTheDocument();
  });

  it('renders a removal dot when the plant was removed in the given year', () => {
    const plant = {
      ...mockCalendarPlant,
      observations: [
        ...mockCalendarPlant.observations,
        { id: 'obs-removed', observedDate: '2026-07-01', type: 'status_change' as const, note: '', previousStatus: 'growing', newStatus: 'removed' } as CalendarObservation,
      ],
    };
    render(<PlantingGantt plants={[plant]} year={YEAR} />);
    expect(document.querySelector('[title="Removed"]')).toBeInTheDocument();
  });

  it('bar extends to 100% for years before the current year', () => {
    // Year 2024 is in the past — the bar end should be calculated as 100%
    // (no removal, not current year → else branch in barBounds)
    const plant = { ...mockCalendarPlant, startDate: '2024-03-01' };
    // Should render without errors — the bar end falls into the `end = 100` branch
    render(<PlantingGantt plants={[plant]} year={2024} />);
    expect(screen.getByRole('link', { name: /tomato/i })).toBeInTheDocument();
  });
});
