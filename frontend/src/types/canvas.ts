export interface CanvasItem {
  id: string;
  x: number;
  y: number;
  widthFt: number;
  heightFt: number;
  rotation?: number;
}

export interface CanvasMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'destructive';
  primary?: boolean;
  shortcut?: string;
}
