import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { CanvasItem, CanvasMenuItem } from '@/types/canvas';
import type { FloatingToolbarPosition } from '@/components/shared/placementCanvas.utils';

type Options = {
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  setToolbarAnchor: (anchor: FloatingToolbarPosition | null) => void;
  computeGroupAnchor: (ids: Set<string>, positions: CanvasItem[]) => FloatingToolbarPosition | null;
  items: CanvasItem[];
  widthFt: number;
  heightFt: number;
  svgRef: RefObject<SVGSVGElement | null>;
  getMenuItems: (id: string) => CanvasMenuItem[];
  onMove: (id: string, x: number, y: number) => void;
  onDeleteItems?: (ids: string[]) => void;
  onCopyItem?: (id: string) => void;
  onPasteItem?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setShowHelp: (show: boolean) => void;
};

export function usePlacementKeyboard({
  selectedIds,
  setSelectedIds,
  setToolbarAnchor,
  computeGroupAnchor,
  items,
  widthFt,
  heightFt,
  svgRef,
  getMenuItems,
  onMove,
  onDeleteItems,
  onCopyItem,
  onPasteItem,
  onUndo,
  onRedo,
  zoomIn,
  zoomOut,
  setShowHelp,
}: Options): void {
  // Selection-dependent keys: Escape, Ctrl+C, Delete, Tab, Arrow, single-char shortcuts
  useEffect(() => {
    if (selectedIds.size === 0) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (selectedIds.size === 0) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (target.closest('[role="dialog"], [role="alertdialog"]')) return;

      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setToolbarAnchor(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIds.size === 1) {
        e.preventDefault();
        const [id] = selectedIds;
        onCopyItem?.(id);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedIds.size === 1) {
          const [id] = selectedIds;
          const deleteItem = getMenuItems(id).find(mi => mi.variant === 'destructive');
          deleteItem?.onClick();
        } else {
          onDeleteItems?.(Array.from(selectedIds));
        }
        setSelectedIds(new Set());
        setToolbarAnchor(null);
        return;
      }

      if (selectedIds.size === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
        const [id] = selectedIds;
        const match = getMenuItems(id).find(mi => mi.shortcut === e.key);
        if (match) {
          e.preventDefault();
          match.onClick();
          setSelectedIds(new Set());
          setToolbarAnchor(null);
          return;
        }
      }

      if (e.key === 'Tab') {
        if (items.length === 0 || !svgRef.current) return;
        e.preventDefault();
        const sorted = [...items].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);
        const primaryId = selectedIds.size === 1 ? [...selectedIds][0] : null;
        const currentIndex = primaryId ? sorted.findIndex(i => i.id === primaryId) : -1;
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + sorted.length) % sorted.length
          : (currentIndex + 1) % sorted.length;
        const next = sorted[nextIndex];
        const newIds = new Set([next.id]);
        setSelectedIds(newIds);
        setToolbarAnchor(computeGroupAnchor(newIds, items));
        return;
      }

      const NUDGE = e.shiftKey ? 1 : 0.1;
      const ndx = e.key === 'ArrowLeft' ? -NUDGE : e.key === 'ArrowRight' ? NUDGE : 0;
      const ndy = e.key === 'ArrowUp' ? -NUDGE : e.key === 'ArrowDown' ? NUDGE : 0;
      if (ndx === 0 && ndy === 0) return;
      e.preventDefault();

      if (!svgRef.current) return;
      const newPositions: CanvasItem[] = [];
      for (const id of selectedIds) {
        const item = items.find(i => i.id === id);
        if (!item) continue;
        const newX = Math.max(0, Math.min(item.x + ndx, widthFt - item.widthFt));
        const newY = Math.max(0, Math.min(item.y + ndy, heightFt - item.heightFt));
        onMove(id, newX, newY);
        newPositions.push({ ...item, x: newX, y: newY });
      }
      setToolbarAnchor(computeGroupAnchor(selectedIds, newPositions));
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, items, getMenuItems, onMove, onDeleteItems, onCopyItem, widthFt, heightFt,
      setSelectedIds, setToolbarAnchor, computeGroupAnchor, svgRef]);

  // Global canvas keys: Ctrl+V, Ctrl+Z/Y, zoom +/-, ?
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (target.closest('[role="dialog"], [role="alertdialog"]')) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        onPasteItem?.();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        onUndo?.();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '?') {
        e.preventDefault();
        setShowHelp(true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onPasteItem, onUndo, onRedo, zoomIn, zoomOut, setShowHelp]);
}
