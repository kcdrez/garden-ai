import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { updateUserPlant } from '@/api/plants';
import { mockUserPlant } from '@/test/fixtures';
import StatusChips from './StatusChips';

vi.mock('@/api/plants', () => ({ updateUserPlant: vi.fn() }));

beforeEach(() => {
  vi.mocked(updateUserPlant).mockResolvedValue(mockUserPlant);
});

describe('StatusChips', () => {
  it('renders a button for every status', () => {
    render(<StatusChips gardenId="garden-1" bedId="bed-1" plant={mockUserPlant} />);
    // 6 statuses: planned, planted, growing, fruiting, dormant, removed
    expect(screen.getAllByRole('button')).toHaveLength(6);
  });

  it('disables the button for the current status', () => {
    render(<StatusChips gardenId="garden-1" bedId="bed-1" plant={mockUserPlant} />);
    // mockUserPlant.status = 'growing'
    expect(screen.getByRole('button', { name: /growing/i })).toBeDisabled();
  });

  it('enables buttons for other statuses', () => {
    render(<StatusChips gardenId="garden-1" bedId="bed-1" plant={mockUserPlant} />);
    expect(screen.getByRole('button', { name: /planned/i })).not.toBeDisabled();
  });

  it('calls updateUserPlant with the new status when an inactive chip is clicked', async () => {
    const user = userEvent.setup();
    render(<StatusChips gardenId="garden-1" bedId="bed-1" plant={mockUserPlant} />);

    await user.click(screen.getByRole('button', { name: /planted/i }));

    await waitFor(() =>
      expect(updateUserPlant).toHaveBeenCalledWith('garden-1', 'bed-1', 'plant-1', {
        status: 'planted',
      }),
    );
  });

  it('does not call updateUserPlant when the active chip is clicked', async () => {
    const user = userEvent.setup();
    render(<StatusChips gardenId="garden-1" bedId="bed-1" plant={mockUserPlant} />);

    await user.click(screen.getByRole('button', { name: /growing/i }));

    expect(updateUserPlant).not.toHaveBeenCalled();
  });
});
