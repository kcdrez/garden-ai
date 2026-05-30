import { renderHook, act } from '@/test/test-utils';
import { useGroupedBedSort } from './useGroupedBedSort';
import type { GardenBed } from '@/types/gardens';

const makeBed = (id: string, name: string, gardenId = 'g1', createdAt = '2024-01-01T00:00:00Z'): GardenBed => ({
  id,
  name,
  garden: gardenId,
  gardenName: gardenId === 'g1' ? 'Garden 1' : 'Garden 2',
  length: 4,
  width: 4,
  depth: null,
  unit: 'ft',
  facing: null,
  avgSunlightHours: null,
  soilType: null,
  notes: null,
  plantCount: 0,
  createdAt,
  updatedAt: '2024-01-01T00:00:00Z',
});

const g1Beds = [makeBed('b1', 'Banana', 'g1'), makeBed('b2', 'Apple', 'g1'), makeBed('b3', 'Cherry', 'g1')];
const g2Beds = [makeBed('b4', 'Zucchini', 'g2'), makeBed('b5', 'Arugula', 'g2')];

const grouped = [
  { gardenId: 'g1', beds: g1Beds },
  { gardenId: 'g2', beds: g2Beds },
];

beforeEach(() => {
  localStorage.clear();
});

describe('useGroupedBedSort', () => {
  it('defaults to name-asc when localStorage is empty', () => {
    const { result } = renderHook(() => useGroupedBedSort());
    expect(result.current.sortMode).toBe('name-asc');
  });

  it('reads sort mode from localStorage on mount', () => {
    localStorage.setItem('beds-all-sort', JSON.stringify('name-desc'));
    const { result } = renderHook(() => useGroupedBedSort());
    expect(result.current.sortMode).toBe('name-desc');
  });

  it('getSortedBeds sorts by name-asc', () => {
    const { result } = renderHook(() => useGroupedBedSort());
    const sorted = result.current.getSortedBeds('g1', g1Beds);
    expect(sorted.map((b) => b.name)).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('getSortedBeds sorts by name-desc after handleSortChange', () => {
    const { result } = renderHook(() => useGroupedBedSort());
    act(() => result.current.handleSortChange('name-desc', grouped));
    const sorted = result.current.getSortedBeds('g1', g1Beds);
    expect(sorted.map((b) => b.name)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('handleSortChange persists sort mode to localStorage', () => {
    const { result } = renderHook(() => useGroupedBedSort());
    act(() => result.current.handleSortChange('date-asc', grouped));
    expect(localStorage.getItem('beds-all-sort')).toBe(JSON.stringify('date-asc'));
  });

  it('switching to custom seeds per-garden orders from name-asc', () => {
    const { result } = renderHook(() => useGroupedBedSort());
    act(() => result.current.handleSortChange('custom', grouped));

    // g1: Apple(b2), Banana(b1), Cherry(b3)
    expect(JSON.parse(localStorage.getItem('garden-g1-beds-order')!)).toEqual(['b2', 'b1', 'b3']);
    // g2: Arugula(b5), Zucchini(b4)
    expect(JSON.parse(localStorage.getItem('garden-g2-beds-order')!)).toEqual(['b5', 'b4']);

    const sorted = result.current.getSortedBeds('g1', g1Beds);
    expect(sorted.map((b) => b.name)).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('switching to custom does not reseed if order already exists in localStorage', () => {
    localStorage.setItem('garden-g1-beds-order', JSON.stringify(['b3', 'b1', 'b2']));
    const { result } = renderHook(() => useGroupedBedSort());
    act(() => result.current.handleSortChange('custom', grouped));

    expect(JSON.parse(localStorage.getItem('garden-g1-beds-order')!)).toEqual(['b3', 'b1', 'b2']);
    const sorted = result.current.getSortedBeds('g1', g1Beds);
    expect(sorted.map((b) => b.name)).toEqual(['Cherry', 'Banana', 'Apple']);
  });

  it('getSortedBeds reads custom order from localStorage on mount (lazy load)', () => {
    localStorage.setItem('beds-all-sort', JSON.stringify('custom'));
    localStorage.setItem('garden-g1-beds-order', JSON.stringify(['b3', 'b2', 'b1']));
    const { result } = renderHook(() => useGroupedBedSort());

    const sorted = result.current.getSortedBeds('g1', g1Beds);
    expect(sorted.map((b) => b.name)).toEqual(['Cherry', 'Apple', 'Banana']);
  });

  it('handleReorder moves a bed within a group and persists', () => {
    localStorage.setItem('beds-all-sort', JSON.stringify('custom'));
    localStorage.setItem('garden-g1-beds-order', JSON.stringify(['b2', 'b1', 'b3'])); // Apple, Banana, Cherry

    const { result } = renderHook(() => useGroupedBedSort());
    act(() => result.current.handleReorder('g1', 'b2', 'b3')); // move Apple to Cherry's position

    const sorted = result.current.getSortedBeds('g1', g1Beds);
    expect(sorted.map((b) => b.name)).toEqual(['Banana', 'Cherry', 'Apple']);
    expect(JSON.parse(localStorage.getItem('garden-g1-beds-order')!)).toEqual(['b1', 'b3', 'b2']);
  });

  it('handleReorder does not affect other garden groups', () => {
    localStorage.setItem('beds-all-sort', JSON.stringify('custom'));
    localStorage.setItem('garden-g1-beds-order', JSON.stringify(['b2', 'b1', 'b3']));
    localStorage.setItem('garden-g2-beds-order', JSON.stringify(['b5', 'b4']));

    const { result } = renderHook(() => useGroupedBedSort());
    act(() => result.current.handleReorder('g1', 'b2', 'b3'));

    const g2Sorted = result.current.getSortedBeds('g2', g2Beds);
    expect(g2Sorted.map((b) => b.id)).toEqual(['b5', 'b4']);
  });

  it('handleReorder ignores unknown active id', () => {
    localStorage.setItem('beds-all-sort', JSON.stringify('custom'));
    localStorage.setItem('garden-g1-beds-order', JSON.stringify(['b2', 'b1', 'b3']));

    const { result } = renderHook(() => useGroupedBedSort());
    const before = result.current.getSortedBeds('g1', g1Beds).map((b) => b.id);
    act(() => result.current.handleReorder('g1', 'b999', 'b1'));

    expect(result.current.getSortedBeds('g1', g1Beds).map((b) => b.id)).toEqual(before);
  });

  it('handleReorder ignores unknown over id', () => {
    localStorage.setItem('beds-all-sort', JSON.stringify('custom'));
    localStorage.setItem('garden-g1-beds-order', JSON.stringify(['b2', 'b1', 'b3']));

    const { result } = renderHook(() => useGroupedBedSort());
    const before = result.current.getSortedBeds('g1', g1Beds).map((b) => b.id);
    act(() => result.current.handleReorder('g1', 'b1', 'b999'));

    expect(result.current.getSortedBeds('g1', g1Beds).map((b) => b.id)).toEqual(before);
  });

  it('getSortedBeds appends new beds not in custom order to the end', () => {
    localStorage.setItem('beds-all-sort', JSON.stringify('custom'));
    localStorage.setItem('garden-g1-beds-order', JSON.stringify(['b2', 'b1', 'b3']));

    const extra = makeBed('b9', 'Dragonfruit', 'g1');
    const { result } = renderHook(() => useGroupedBedSort());

    const sorted = result.current.getSortedBeds('g1', [...g1Beds, extra]);
    expect(sorted.map((b) => b.id)).toEqual(['b2', 'b1', 'b3', 'b9']);
  });
});
