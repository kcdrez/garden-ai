import { render, screen } from '@/test/test-utils';
import { mockCalendarPlant } from '@/test/fixtures';
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
});
