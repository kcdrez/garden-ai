import { renderHook } from '@/test/test-utils';
import type { UseFormReturn } from 'react-hook-form';
import { useDialogFormReset } from './useDialogFormReset';

function makeForm() {
  return { reset: vi.fn() } as unknown as UseFormReturn<{ name: string }>;
}

describe('useDialogFormReset', () => {
  it('calls form.reset with getValues() when open becomes true', () => {
    const form = makeForm();
    const getValues = vi.fn().mockReturnValue({ name: 'Alice' });

    const { rerender } = renderHook(
      ({ open }) => useDialogFormReset(form, open, getValues),
      { initialProps: { open: false } },
    );

    rerender({ open: true });

    expect(form.reset).toHaveBeenCalledWith({ name: 'Alice' });
  });

  it('does not call form.reset when open becomes false', () => {
    const form = makeForm();
    const getValues = vi.fn().mockReturnValue({ name: 'Alice' });

    const { rerender } = renderHook(
      ({ open }) => useDialogFormReset(form, open, getValues),
      { initialProps: { open: true } },
    );
    form.reset.mockClear();

    rerender({ open: false });

    expect(form.reset).not.toHaveBeenCalled();
  });

  it('uses the latest getValues on each open — no stale closure', () => {
    const form = makeForm();
    const getValues = vi.fn()
      .mockReturnValueOnce({ name: 'First' })
      .mockReturnValueOnce({ name: 'Second' });

    const { rerender } = renderHook(
      ({ open }) => useDialogFormReset(form, open, getValues),
      { initialProps: { open: false } },
    );

    rerender({ open: true });
    rerender({ open: false });
    rerender({ open: true });

    expect(form.reset).toHaveBeenNthCalledWith(1, { name: 'First' });
    expect(form.reset).toHaveBeenNthCalledWith(2, { name: 'Second' });
  });
});
