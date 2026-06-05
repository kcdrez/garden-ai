import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchCalendarPlants } from '@/api/plants';
import { mockCalendarPlant } from '@/test/fixtures';
import type { CalendarPlant } from '@/types/plants';
import CalendarPage from './CalendarPage';

vi.mock('@/api/plants', () => ({ fetchCalendarPlants: vi.fn() }));

vi.mock('@/components/calendar/PlantingGantt', () => ({
  default: ({ plants, year }: { plants: CalendarPlant[]; year: number }) => (
    <div data-testid="gantt">
      {year} — {plants.length} plant(s)
    </div>
  ),
}));

beforeEach(() => {
  vi.mocked(fetchCalendarPlants).mockClear();
});

describe('CalendarPage', () => {
  it('shows the current year in the header', async () => {
    vi.mocked(fetchCalendarPlants).mockResolvedValueOnce([]);
    render(<CalendarPage />);

    const currentYear = new Date().getFullYear();
    await waitFor(() => expect(screen.getByText(String(currentYear))).toBeInTheDocument());
  });

  it('shows empty message when no plants are returned', async () => {
    vi.mocked(fetchCalendarPlants).mockResolvedValueOnce([]);
    render(<CalendarPage />);

    const currentYear = new Date().getFullYear();
    await waitFor(() =>
      expect(screen.getByText(new RegExp(`no plants.*${currentYear}`, 'i'))).toBeInTheDocument(),
    );
  });

  it('renders the gantt when plants are returned', async () => {
    vi.mocked(fetchCalendarPlants).mockResolvedValueOnce([mockCalendarPlant]);
    render(<CalendarPage />);

    await waitFor(() => expect(screen.getByTestId('gantt')).toBeInTheDocument());
    expect(screen.getByTestId('gantt')).toHaveTextContent('1 plant(s)');
  });

  it('decrements the year when previous year button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchCalendarPlants).mockResolvedValue([]);
    render(<CalendarPage />);

    const currentYear = new Date().getFullYear();
    await waitFor(() => expect(screen.getByText(String(currentYear))).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /previous year/i }));

    expect(screen.getByText(String(currentYear - 1))).toBeInTheDocument();
  });

  it('increments the year when next year button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchCalendarPlants).mockResolvedValue([]);
    render(<CalendarPage />);

    const currentYear = new Date().getFullYear();
    await waitFor(() => expect(screen.getByText(String(currentYear))).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /next year/i }));

    expect(screen.getByText(String(currentYear + 1))).toBeInTheDocument();
  });
});
