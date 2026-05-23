import { posInt, optPosInt } from '@/lib/zod';

describe('posInt', () => {
  it('accepts "1"', () => {
    expect(posInt.safeParse('1').success).toBe(true);
  });

  it('accepts large positive integers', () => {
    expect(posInt.safeParse('999').success).toBe(true);
  });

  it('rejects empty string', () => {
    expect(posInt.safeParse('').success).toBe(false);
  });

  it('rejects "0"', () => {
    expect(posInt.safeParse('0').success).toBe(false);
  });

  it('rejects negative strings', () => {
    expect(posInt.safeParse('-1').success).toBe(false);
  });

  it('rejects decimals', () => {
    expect(posInt.safeParse('1.5').success).toBe(false);
  });

  it('rejects non-numeric strings', () => {
    expect(posInt.safeParse('abc').success).toBe(false);
  });
});

describe('optPosInt', () => {
  it('accepts empty string (no value)', () => {
    expect(optPosInt.safeParse('').success).toBe(true);
  });

  it('accepts "1"', () => {
    expect(optPosInt.safeParse('1').success).toBe(true);
  });

  it('accepts large positive integers', () => {
    expect(optPosInt.safeParse('100').success).toBe(true);
  });

  it('rejects "0"', () => {
    expect(optPosInt.safeParse('0').success).toBe(false);
  });

  it('rejects decimals', () => {
    expect(optPosInt.safeParse('2.5').success).toBe(false);
  });

  it('rejects non-numeric strings', () => {
    expect(optPosInt.safeParse('abc').success).toBe(false);
  });
});
