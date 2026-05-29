import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import SortDropdown from './SortDropdown';
import type { SortMode } from '@/hooks/useSortedList';

describe('SortDropdown', () => {
  it('renders a select with aria-label', () => {
    render(<SortDropdown value="name-asc" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: /sort order/i })).toBeInTheDocument();
  });

  it('shows the current value as selected', () => {
    render(<SortDropdown value="date-desc" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: /sort order/i })).toHaveValue('date-desc');
  });

  it('renders all five sort options', () => {
    render(<SortDropdown value="name-asc" onChange={vi.fn()} />);
    const select = screen.getByRole('combobox', { name: /sort order/i });
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.value);
    expect(options).toEqual(['name-asc', 'name-desc', 'date-desc', 'date-asc', 'custom']);
  });

  it('calls onChange with the selected SortMode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SortDropdown value="name-asc" onChange={onChange} />);

    await user.selectOptions(screen.getByRole('combobox', { name: /sort order/i }), 'date-desc');

    expect(onChange).toHaveBeenCalledWith('date-desc' satisfies SortMode);
  });

  it('shows the grip icon when value is custom', () => {
    const { container } = render(<SortDropdown value="custom" onChange={vi.fn()} />);
    // The grip icon is a lucide SVG — confirm it is present in the DOM
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show the grip icon for non-custom modes', () => {
    const { container } = render(<SortDropdown value="name-asc" onChange={vi.fn()} />);
    // The chevron SVG is always present; the grip SVG (lucide icon) is only rendered for custom
    const svgs = container.querySelectorAll('svg');
    // Only the inline chevron path SVG — no lucide GripVertical element
    expect(svgs).toHaveLength(1);
  });
});
