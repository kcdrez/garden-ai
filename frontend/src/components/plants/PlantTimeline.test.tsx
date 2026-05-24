import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchObservations } from '@/api/plants';
import { mockUserPlant } from '@/test/fixtures';
import PlantTimeline from './PlantTimeline';

vi.mock('@/api/plants', () => ({ fetchObservations: vi.fn() }));

vi.mock('@/components/plants/StatusChips', () => ({
  default: () => <div data-testid="status-chips" />,
}));

vi.mock('@/components/plants/ObservationList', () => ({
  default: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="observation-list">{isLoading ? 'Loading observations' : 'Observations loaded'}</div>
  ),
}));

vi.mock('@/components/plants/ObservationForm', () => ({
  default: ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => (
    <div data-testid="observation-form">
      <button onClick={onSuccess}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

beforeEach(() => {
  vi.mocked(fetchObservations).mockResolvedValue([]);
});

describe('PlantTimeline', () => {
  it('renders StatusChips', async () => {
    render(<PlantTimeline gardenId="garden-1" bedId="bed-1" plant={mockUserPlant} />);
    expect(screen.getByTestId('status-chips')).toBeInTheDocument();
  });

  it('passes isLoading=true to ObservationList while fetching', () => {
    vi.mocked(fetchObservations).mockImplementation(() => new Promise(() => {}));
    render(<PlantTimeline gardenId="garden-1" bedId="bed-1" plant={mockUserPlant} />);
    expect(screen.getByText('Loading observations')).toBeInTheDocument();
  });

  it('shows the Add Observation button by default', async () => {
    render(<PlantTimeline gardenId="garden-1" bedId="bed-1" plant={mockUserPlant} />);
    expect(await screen.findByRole('button', { name: /add observation/i })).toBeInTheDocument();
  });

  it('shows ObservationForm and hides the button when Add Observation is clicked', async () => {
    const user = userEvent.setup();
    render(<PlantTimeline gardenId="garden-1" bedId="bed-1" plant={mockUserPlant} />);

    await user.click(await screen.findByRole('button', { name: /add observation/i }));

    expect(screen.getByTestId('observation-form')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add observation/i })).not.toBeInTheDocument();
  });

  it('hides the form and shows the button again when cancelled', async () => {
    const user = userEvent.setup();
    render(<PlantTimeline gardenId="garden-1" bedId="bed-1" plant={mockUserPlant} />);

    await user.click(await screen.findByRole('button', { name: /add observation/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() =>
      expect(screen.queryByTestId('observation-form')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /add observation/i })).toBeInTheDocument();
  });

  it('hides the form and shows the button again on successful submit', async () => {
    const user = userEvent.setup();
    render(<PlantTimeline gardenId="garden-1" bedId="bed-1" plant={mockUserPlant} />);

    await user.click(await screen.findByRole('button', { name: /add observation/i }));
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() =>
      expect(screen.queryByTestId('observation-form')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /add observation/i })).toBeInTheDocument();
  });
});
