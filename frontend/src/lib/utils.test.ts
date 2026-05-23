import { cn, isCardNavigationSuppressed } from '@/lib/utils';
import type { MouseEvent } from 'react';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('removes falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('resolves tailwind conflicts — last wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles conditional objects', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });
});

describe('isCardNavigationSuppressed', () => {
  function makeEvent(closest: Element | null): MouseEvent {
    return {
      target: {
        closest: () => closest,
      },
    } as unknown as MouseEvent;
  }

  it('returns false when target is plain element with no matching ancestor', () => {
    expect(isCardNavigationSuppressed(makeEvent(null))).toBe(false);
  });

  it('returns true when target is inside a button', () => {
    const button = document.createElement('button');
    expect(isCardNavigationSuppressed(makeEvent(button))).toBe(true);
  });

  it('returns true when target is inside a menu role element', () => {
    const menu = document.createElement('div');
    menu.setAttribute('role', 'menu');
    expect(isCardNavigationSuppressed(makeEvent(menu))).toBe(true);
  });
});
