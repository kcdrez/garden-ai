import { useState } from 'react';
import { ZOOM_LEVELS, type ZoomLevel } from '@/components/shared/placementCanvas.utils';

export function usePlacementZoom(storageKey?: string, defaultZoom: ZoomLevel = 1): {
  zoom: ZoomLevel;
  setZoom: (level: ZoomLevel) => void;
  zoomIn: () => void;
  zoomOut: () => void;
} {
  const [zoom, setZoomState] = useState<ZoomLevel>(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      const parsed = Number(stored);
      if (ZOOM_LEVELS.includes(parsed as ZoomLevel)) return parsed as ZoomLevel;
    }
    return defaultZoom;
  });

  function setZoom(level: ZoomLevel) {
    setZoomState(level);
    if (storageKey) localStorage.setItem(storageKey, String(level));
  }

  function zoomIn() {
    const next = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(zoom) + 1];
    if (next !== undefined) setZoom(next);
  }

  function zoomOut() {
    const prev = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(zoom) - 1];
    if (prev !== undefined) setZoom(prev);
  }

  return { zoom, setZoom, zoomIn, zoomOut };
}
