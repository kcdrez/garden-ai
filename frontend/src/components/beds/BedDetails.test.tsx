import { render, screen } from '@/test/test-utils';
import { mockBed } from '@/test/fixtures';
import BedDetails from './BedDetails';

describe('BedDetails', () => {
  it('renders nothing when the bed has no optional fields', () => {
    const { container } = render(<BedDetails bed={mockBed} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders average sunlight hours', () => {
    render(<BedDetails bed={{ ...mockBed, avgSunlightHours: 6 }} />);
    expect(screen.getByText(/6 hrs\/day/i)).toBeInTheDocument();
  });

  it('renders soil type', () => {
    render(<BedDetails bed={{ ...mockBed, soilType: 'Loamy clay' }} />);
    expect(screen.getByText('Loamy clay')).toBeInTheDocument();
  });

  it('renders notes when showNotes is true (default)', () => {
    render(<BedDetails bed={{ ...mockBed, notes: 'Needs more watering' }} />);
    expect(screen.getByText('Needs more watering')).toBeInTheDocument();
  });

  it('does not render notes when showNotes is false', () => {
    render(<BedDetails bed={{ ...mockBed, notes: 'Needs more watering' }} showNotes={false} />);
    expect(screen.queryByText('Needs more watering')).not.toBeInTheDocument();
  });
});
