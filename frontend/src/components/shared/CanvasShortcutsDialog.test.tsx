import { render, screen } from '@/test/test-utils';
import CanvasShortcutsDialog from './CanvasShortcutsDialog';

describe('CanvasShortcutsDialog', () => {
  it('renders the dialog with shortcut sections when open', () => {
    render(<CanvasShortcutsDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CanvasShortcutsDialog open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows zoom section shortcuts', () => {
    render(<CanvasShortcutsDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText('Zoom')).toBeInTheDocument();
    expect(screen.getByText('Zoom in')).toBeInTheDocument();
    expect(screen.getByText('Zoom out')).toBeInTheDocument();
  });

  it('shows rotation shortcuts', () => {
    render(<CanvasShortcutsDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText('Rotate 45° clockwise')).toBeInTheDocument();
    expect(screen.getByText('Rotate 45° counter-clockwise')).toBeInTheDocument();
  });

  it('shows undo/redo shortcuts', () => {
    render(<CanvasShortcutsDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText('Undo move / resize')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
  });
});
