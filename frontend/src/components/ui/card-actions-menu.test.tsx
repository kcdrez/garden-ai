import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import CardActionsMenu from './card-actions-menu';

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

describe('CardActionsMenu', () => {
  it('renders trigger with default aria-label when no label is provided', () => {
    render(<CardActionsMenu onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
  });

  it('renders trigger with custom aria-label', () => {
    render(<CardActionsMenu label="Garden actions" onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Garden actions' })).toBeInTheDocument();
  });

  it('calls onEdit when Edit is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<CardActionsMenu onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('calls onDelete when Delete is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<CardActionsMenu onEdit={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('renders Move to Another Bed when onMove is provided', () => {
    render(<CardActionsMenu onEdit={vi.fn()} onDelete={vi.fn()} onMove={vi.fn()} />);
    expect(screen.getByRole('button', { name: /move to another bed/i })).toBeInTheDocument();
  });

  it('does not render Move to Another Bed when onMove is not provided', () => {
    render(<CardActionsMenu onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /move to another bed/i })).not.toBeInTheDocument();
  });

  it('calls onMove when Move to Another Bed is clicked', async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    render(<CardActionsMenu onEdit={vi.fn()} onDelete={vi.fn()} onMove={onMove} />);

    await user.click(screen.getByRole('button', { name: /move to another bed/i }));

    expect(onMove).toHaveBeenCalledOnce();
  });

  it('shows "Deleting…" and disables delete when isDeleting is true', () => {
    render(<CardActionsMenu onEdit={vi.fn()} onDelete={vi.fn()} isDeleting />);
    const btn = screen.getByRole('button', { name: /deleting/i });
    expect(btn).toBeDisabled();
  });
});
