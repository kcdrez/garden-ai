import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ConfirmProvider, useConfirm } from './useConfirm';

function TestComponent({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button onClick={() => confirm({ title: 'Delete item?', description: 'This cannot be undone.' }).then(onResult)}>
      Open
    </button>
  );
}

function renderWithProvider(onResult: (v: boolean) => void) {
  return render(
    <ConfirmProvider>
      <TestComponent onResult={onResult} />
    </ConfirmProvider>,
  );
}

describe('useConfirm', () => {
  it('shows the dialog title and description when confirm is called', async () => {
    const user = userEvent.setup();
    renderWithProvider(vi.fn());

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByText('Delete item?')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('resolves true when the confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    renderWithProvider(onResult);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
  });

  it('resolves false when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    renderWithProvider(onResult);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
  });

  it('throws when used outside ConfirmProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent onResult={vi.fn()} />)).toThrow(
      'useConfirm must be used within ConfirmProvider',
    );
    spy.mockRestore();
  });
});
