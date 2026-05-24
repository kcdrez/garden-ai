import { render, screen } from '@/test/test-utils';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders "Planned" for planned status', () => {
    render(<StatusBadge status="planned" />);
    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('renders "Growing" for growing status', () => {
    render(<StatusBadge status="growing" />);
    expect(screen.getByText('Growing')).toBeInTheDocument();
  });

  it('renders "Removed" for removed status', () => {
    render(<StatusBadge status="removed" />);
    expect(screen.getByText('Removed')).toBeInTheDocument();
  });
});
