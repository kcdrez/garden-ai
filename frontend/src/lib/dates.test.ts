import { getTodayISO, formatObservationDate, formatDate } from '@/lib/dates';

describe('getTodayISO', () => {
  it('returns a string matching YYYY-MM-DD', () => {
    expect(getTodayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches today date parts', () => {
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(getTodayISO()).toBe(expected);
  });
});

describe('formatObservationDate', () => {
  it('formats a date string to en-US short format', () => {
    expect(formatObservationDate('2024-03-15')).toBe('Mar 15, 2024');
  });

  it('does not shift the date due to timezone (appends T00:00:00)', () => {
    expect(formatObservationDate('2024-01-01')).toBe('Jan 1, 2024');
  });
});

describe('formatDate', () => {
  it('returns a long-form en-US date string', () => {
    expect(formatDate('2024-06-10T14:30:00Z')).toBe('June 10, 2024');
  });

  it('includes time when includeTime is true', () => {
    expect(formatDate('2024-06-10T14:30:00Z', true)).toBe('June 10, 2024 at 2:30 PM');
  });

  it('excludes time when includeTime is false (default)', () => {
    expect(formatDate('2024-06-10T14:30:00Z', false)).toBe('June 10, 2024');
  });
});
