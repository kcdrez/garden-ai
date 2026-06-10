import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import CompassRose from './CompassRose';

describe('CompassRose', () => {
  it('renders a button with North label', () => {
    render(<CompassRose orientation={0} onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /north orientation/i })).toBeInTheDocument();
    expect(screen.getByText('North')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CompassRose orientation={0} onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: /north orientation/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies rotation transform to the needle group', () => {
    const { container } = render(<CompassRose orientation={90} onClick={vi.fn()} />);
    const rotatedGroup = container.querySelector('g[transform]');
    expect(rotatedGroup?.getAttribute('transform')).toBe('rotate(90, 16, 16)');
  });

  it('applies 0° rotation when orientation is 0', () => {
    const { container } = render(<CompassRose orientation={0} onClick={vi.fn()} />);
    const rotatedGroup = container.querySelector('g[transform]');
    expect(rotatedGroup?.getAttribute('transform')).toBe('rotate(0, 16, 16)');
  });

  it('renders the N label inside the SVG', () => {
    const { container } = render(<CompassRose orientation={0} onClick={vi.fn()} />);
    const nLabel = container.querySelector('text');
    expect(nLabel?.textContent).toBe('N');
  });

  it('has a descriptive title', () => {
    render(<CompassRose orientation={0} onClick={vi.fn()} />);
    expect(screen.getByTitle(/rotate north orientation/i)).toBeInTheDocument();
  });
});
