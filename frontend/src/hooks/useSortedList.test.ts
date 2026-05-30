import { renderHook, act } from '@/test/test-utils';
import { sortItems, applyCustomOrder, useSortedList } from './useSortedList';

const items = [
  { id: '1', name: 'Banana', createdAt: '2024-01-03T00:00:00Z' },
  { id: '2', name: 'Apple', createdAt: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'Cherry', createdAt: '2024-01-02T00:00:00Z' },
];

beforeEach(() => {
  localStorage.clear();
});

describe('sortItems', () => {
  it('sorts name-asc', () => {
    expect(sortItems(items, 'name-asc').map((i) => i.name)).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('sorts name-desc', () => {
    expect(sortItems(items, 'name-desc').map((i) => i.name)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('sorts date-asc (oldest first)', () => {
    expect(sortItems(items, 'date-asc').map((i) => i.id)).toEqual(['2', '3', '1']);
  });

  it('sorts date-desc (newest first)', () => {
    expect(sortItems(items, 'date-desc').map((i) => i.id)).toEqual(['1', '3', '2']);
  });

  it('does not mutate the original array', () => {
    const original = [...items];
    sortItems(items, 'name-desc');
    expect(items).toEqual(original);
  });
});

describe('applyCustomOrder', () => {
  it('returns items in the order specified by the order array', () => {
    expect(applyCustomOrder(items, ['3', '1', '2']).map((i) => i.name)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('appends items not in the order array to the end', () => {
    const extra = { id: '4', name: 'Dragonfruit', createdAt: '2024-01-04T00:00:00Z' };
    expect(applyCustomOrder([...items, extra], ['3', '1', '2']).map((i) => i.id)).toEqual(['3', '1', '2', '4']);
  });

  it('returns the original items unchanged when order is empty', () => {
    expect(applyCustomOrder(items, [])).toEqual(items);
  });
});

describe('useSortedList', () => {
  it('defaults to name-asc when localStorage is empty', () => {
    const { result } = renderHook(() => useSortedList(items, 'test'));
    expect(result.current.sortMode).toBe('name-asc');
    expect(result.current.sorted.map((i) => i.name)).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('reads sort mode from localStorage on mount', () => {
    localStorage.setItem('test-sort', JSON.stringify('name-desc'));
    const { result } = renderHook(() => useSortedList(items, 'test'));
    expect(result.current.sortMode).toBe('name-desc');
    expect(result.current.sorted.map((i) => i.name)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('reads custom order from localStorage on mount', () => {
    localStorage.setItem('test-sort', JSON.stringify('custom'));
    localStorage.setItem('test-order', JSON.stringify(['3', '1', '2']));
    const { result } = renderHook(() => useSortedList(items, 'test'));
    expect(result.current.sorted.map((i) => i.name)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('setSortMode updates sorted output and persists to localStorage', () => {
    const { result } = renderHook(() => useSortedList(items, 'test'));

    act(() => result.current.setSortMode('date-asc'));

    expect(result.current.sortMode).toBe('date-asc');
    expect(result.current.sorted.map((i) => i.id)).toEqual(['2', '3', '1']);
    expect(localStorage.getItem('test-sort')).toBe(JSON.stringify('date-asc'));
  });

  it('switching to custom seeds order from the current sort so the list does not jump', () => {
    const { result } = renderHook(() => useSortedList(items, 'test'));
    // default name-asc → Apple(2), Banana(1), Cherry(3)

    act(() => result.current.setSortMode('custom'));

    expect(result.current.sortMode).toBe('custom');
    expect(result.current.sorted.map((i) => i.name)).toEqual(['Apple', 'Banana', 'Cherry']);
    expect(JSON.parse(localStorage.getItem('test-order')!)).toEqual(['2', '1', '3']);
  });

  it('switching to custom with an existing order does not reseed', () => {
    localStorage.setItem('test-order', JSON.stringify(['3', '1', '2'])); // Cherry, Banana, Apple
    const { result } = renderHook(() => useSortedList(items, 'test'));

    act(() => result.current.setSortMode('custom'));

    expect(result.current.sorted.map((i) => i.name)).toEqual(['Cherry', 'Banana', 'Apple']);
    expect(JSON.parse(localStorage.getItem('test-order')!)).toEqual(['3', '1', '2']);
  });

  it('handleReorder moves an item to the target position and persists', () => {
    localStorage.setItem('test-sort', JSON.stringify('custom'));
    localStorage.setItem('test-order', JSON.stringify(['2', '1', '3'])); // Apple, Banana, Cherry

    const { result } = renderHook(() => useSortedList(items, 'test'));

    act(() => result.current.handleReorder('2', '3')); // move Apple to Cherry's position

    expect(result.current.sorted.map((i) => i.name)).toEqual(['Banana', 'Cherry', 'Apple']);
    expect(JSON.parse(localStorage.getItem('test-order')!)).toEqual(['1', '3', '2']);
  });

  it('handleReorder ignores unknown active id', () => {
    localStorage.setItem('test-sort', JSON.stringify('custom'));
    localStorage.setItem('test-order', JSON.stringify(['2', '1', '3']));
    const { result } = renderHook(() => useSortedList(items, 'test'));
    const before = result.current.sorted.map((i) => i.id);

    act(() => result.current.handleReorder('999', '1'));

    expect(result.current.sorted.map((i) => i.id)).toEqual(before);
  });

  it('handleReorder ignores unknown over id', () => {
    localStorage.setItem('test-sort', JSON.stringify('custom'));
    localStorage.setItem('test-order', JSON.stringify(['2', '1', '3']));
    const { result } = renderHook(() => useSortedList(items, 'test'));
    const before = result.current.sorted.map((i) => i.id);

    act(() => result.current.handleReorder('1', '999'));

    expect(result.current.sorted.map((i) => i.id)).toEqual(before);
  });

  it('appends new items not in customOrder to the end', () => {
    const extra = { id: '4', name: 'Dragonfruit', createdAt: '2024-01-04T00:00:00Z' };
    localStorage.setItem('test-sort', JSON.stringify('custom'));
    localStorage.setItem('test-order', JSON.stringify(['2', '1', '3'])); // Apple, Banana, Cherry

    const { result } = renderHook(() => useSortedList([...items, extra], 'test'));

    expect(result.current.sorted.map((i) => i.id)).toEqual(['2', '1', '3', '4']);
  });
});
