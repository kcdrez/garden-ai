import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { deleteObservation, updateObservation } from '@/api/plants';
import type { Observation as ObservationT } from '@/types/plants';
import type { Observation } from '@/types/plants';
import ObservationList from './ObservationList';

vi.mock('@/api/plants', () => ({ deleteObservation: vi.fn(), updateObservation: vi.fn() }));

const mockObservation: Observation = {
  id: 'obs-1',
  userPlant: 'plant-1',
  type: 'general',
  observedDate: '2024-06-01',
  note: 'Looks healthy',
  previousStatus: '',
  newStatus: '',
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

const mockStatusChange: Observation = {
  id: 'obs-2',
  userPlant: 'plant-1',
  type: 'status_change',
  observedDate: '2024-06-02',
  note: '',
  previousStatus: 'planned',
  newStatus: 'growing',
  createdAt: '2024-06-02T00:00:00Z',
  updatedAt: '2024-06-02T00:00:00Z',
};

function renderList(props: Partial<React.ComponentProps<typeof ObservationList>> = {}) {
  return render(
    <ObservationList
      gardenId="garden-1"
      bedId="bed-1"
      plantId="plant-1"
      observations={[]}
      isLoading={false}
      error={null}
      {...props}
    />,
  );
}

beforeEach(() => {
  vi.mocked(deleteObservation).mockResolvedValue(undefined);
  vi.mocked(updateObservation).mockResolvedValue({} as ObservationT);
});

describe('ObservationList', () => {
  it('shows loading state', () => {
    renderList({ isLoading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty message when there are no observations', () => {
    renderList({ observations: [] });
    expect(screen.getByText('No history yet.')).toBeInTheDocument();
  });

  it('renders a general observation note and date', () => {
    renderList({ observations: [mockObservation] });
    expect(screen.getByText('Looks healthy')).toBeInTheDocument();
    expect(screen.getByText(/Jun 1, 2024/i)).toBeInTheDocument();
  });

  it('renders the label for a status_change observation', () => {
    renderList({ observations: [mockStatusChange] });
    expect(screen.getByText(/moved to growing/i)).toBeInTheDocument();
  });

  it('renders the heading and note for a transplant observation', () => {
    const transplant: Observation = {
      id: 'obs-3',
      userPlant: 'plant-1',
      type: 'transplant',
      observedDate: '2024-06-03',
      note: 'Moved from Bed 1 to Bed 2',
      previousStatus: '',
      newStatus: '',
      createdAt: '2024-06-03T00:00:00Z',
      updatedAt: '2024-06-03T00:00:00Z',
    };
    renderList({ observations: [transplant] });
    expect(screen.getByText('Transplant')).toBeInTheDocument();
    expect(screen.getByText('Moved from Bed 1 to Bed 2')).toBeInTheDocument();
  });

  it('shows error state', () => {
    renderList({ error: new Error('Failed to load') });
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('calls deleteObservation when the delete button is clicked', async () => {
    const user = userEvent.setup();
    renderList({ observations: [mockObservation] });

    await user.click(screen.getByRole('button', { name: /delete observation/i }));

    await waitFor(() =>
      expect(deleteObservation).toHaveBeenCalledWith('garden-1', 'bed-1', 'plant-1', 'obs-1'),
    );
  });

  it('shows the edit form when the edit button is clicked', async () => {
    const user = userEvent.setup();
    renderList({ observations: [mockObservation] });

    await user.click(screen.getByRole('button', { name: /edit observation/i }));

    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('returns to view mode when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderList({ observations: [mockObservation] });

    await user.click(screen.getByRole('button', { name: /edit observation/i }));
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit observation/i })).toBeInTheDocument();
  });

  it('calls updateObservation and closes the edit form on save', async () => {
    const user = userEvent.setup();
    renderList({ observations: [mockObservation] });

    await user.click(screen.getByRole('button', { name: /edit observation/i }));

    const dateInput = screen.getByLabelText(/date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2024-07-01');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(updateObservation).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        'plant-1',
        'obs-1',
        expect.objectContaining({ observedDate: '2024-07-01' }),
      ),
    );
  });
});
