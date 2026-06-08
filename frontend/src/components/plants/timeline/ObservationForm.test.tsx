import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { createObservation } from '@/api/plants';
import ObservationForm from './ObservationForm';

vi.mock('@/api/plants', () => ({ createObservation: vi.fn() }));

const onSuccess = vi.fn();
const onCancel = vi.fn();

function renderForm() {
  return render(
    <ObservationForm
      gardenId="garden-1"
      bedId="bed-1"
      plantId="plant-1"
      onSuccess={onSuccess}
      onCancel={onCancel}
    />,
  );
}

beforeEach(() => {
  vi.mocked(createObservation).mockResolvedValue({
    id: 'obs-1',
    userPlant: 'plant-1',
    type: 'general',
    observedDate: '2024-06-01',
    note: 'test',
    previousStatus: '',
    newStatus: '',
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
  });
});

describe('ObservationForm', () => {
  it('renders the type selector and date field', () => {
    renderForm();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  });

  it('shows the note field for non-status_change types', () => {
    renderForm();
    expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
  });

  it('shows the New Status field when type is status_change', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText(/type/i), 'status_change');

    expect(screen.getByLabelText(/new status/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^note$/i)).not.toBeInTheDocument();
  });

  it('submit is disabled until the form is valid', () => {
    renderForm();
    // default type=general, note='' → invalid
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('submits with a note and calls createObservation', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/note/i), 'Spotted some growth');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(createObservation).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        'plant-1',
        expect.objectContaining({ type: 'general', note: 'Spotted some growth' }),
      ),
    );
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});
