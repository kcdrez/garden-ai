import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { deleteGarden } from '@/api/gardens';
import { mockNavigate } from '@/test/test-setup';
import { mockGarden } from '@/test/fixtures';
import type { Garden } from '@/types/gardens';
import GardenDetailHeader from './GardenDetailHeader';

vi.mock('@/api/gardens', () => ({ deleteGarden: vi.fn() }));

vi.mock('@/components/gardens/GardenEditForm', () => ({
  default: ({ open }: { open: boolean; garden: Garden }) =>
    open ? <div role="dialog" aria-label="Edit Garden Form" /> : null,
}));

const mockConfirm = vi.fn();
vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => mockConfirm,
  ConfirmProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  vi.mocked(deleteGarden).mockResolvedValue(undefined);
  mockConfirm.mockResolvedValue(true);
});

describe('GardenDetailHeader', () => {
  it('renders the garden name and description', () => {
    render(<GardenDetailHeader garden={mockGarden} />);

    expect(screen.getByRole('heading', { name: 'Front Yard' })).toBeInTheDocument();
    expect(screen.getByText('My main garden')).toBeInTheDocument();
  });

  it('renders a back link to the gardens list', () => {
    render(<GardenDetailHeader garden={mockGarden} />);

    expect(screen.getByRole('link', { name: /your gardens/i })).toBeInTheDocument();
  });

  it('opens the edit form when Edit is clicked', async () => {
    const user = userEvent.setup();
    render(<GardenDetailHeader garden={mockGarden} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('dialog', { name: /edit garden form/i })).toBeInTheDocument();
  });

  it('calls deleteGarden after confirming delete', async () => {
    const user = userEvent.setup();
    render(<GardenDetailHeader garden={mockGarden} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(deleteGarden).toHaveBeenCalledWith('garden-1'));
  });

  it('does not delete when confirm is cancelled', async () => {
    mockConfirm.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<GardenDetailHeader garden={mockGarden} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(deleteGarden).not.toHaveBeenCalled();
  });

  it('navigates to the gardens list after successful delete', async () => {
    const user = userEvent.setup();
    render(<GardenDetailHeader garden={mockGarden} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/gardens'));
  });
});
