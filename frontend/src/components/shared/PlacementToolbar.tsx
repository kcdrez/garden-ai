import { MoreHorizontalIcon, Trash2Icon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { CanvasMenuItem } from '@/types/canvas';
import type { FloatingToolbarPosition } from '@/components/shared/placementCanvas.utils';

type Props = {
  anchor: FloatingToolbarPosition;
  selectedCount: number;
  menuItems: CanvasMenuItem[];
  onClearSelection: () => void;
  onDeleteAll?: () => void;
};

export default function PlacementToolbar({
  anchor,
  selectedCount,
  menuItems,
  onClearSelection,
  onDeleteAll,
}: Props) {
  const style = {
    position: 'fixed' as const,
    top: anchor.top - 44,
    left: anchor.left + anchor.width / 2,
    transform: 'translateX(-50%)',
    zIndex: 50,
  };

  if (selectedCount === 1) {
    const primary = menuItems.filter((mi) => mi.primary);
    const overflow = menuItems.filter((mi) => !mi.primary);
    return (
      <div
        style={style}
        className="flex items-center bg-popover border border-border rounded-lg shadow-lg px-1 py-1"
      >
        {primary.map((mi) => (
          <button
            key={mi.label}
            type="button"
            aria-label={mi.label}
            onClick={() => { mi.onClick(); onClearSelection(); }}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-muted',
              mi.variant === 'destructive' ? 'text-destructive' : '',
            )}
          >
            {mi.icon && <span className="[&>svg]:size-3">{mi.icon}</span>}
            {mi.label}
            {mi.shortcut && (
              <kbd className="ml-0.5 font-mono text-[10px] opacity-50">{mi.shortcut}</kbd>
            )}
          </button>
        ))}

        {overflow.length > 0 && (
          <>
            {primary.length > 0 && <div className="w-px h-4 bg-border mx-0.5" />}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center px-2 py-1 rounded text-xs hover:bg-muted text-muted-foreground"
              >
                <MoreHorizontalIcon className="size-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                {overflow.map((mi) => (
                  <DropdownMenuItem
                    key={mi.label}
                    variant={mi.variant}
                    onClick={() => { mi.onClick(); onClearSelection(); }}
                  >
                    {mi.icon}
                    {mi.label}
                    {mi.shortcut && (
                      <kbd className="ml-auto pl-4 font-mono text-xs opacity-50">{mi.shortcut}</kbd>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      style={style}
      className="flex items-center bg-popover border border-border rounded-lg shadow-lg px-1 py-1"
    >
      <span className="px-2 text-xs text-muted-foreground">{selectedCount} selected</span>
      <div className="w-px h-4 bg-foreground/20 mx-0.5 self-center" />
      <button
        type="button"
        onClick={() => { onDeleteAll?.(); onClearSelection(); }}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-muted text-destructive"
      >
        <Trash2Icon className="size-3" />
        Delete all
      </button>
    </div>
  );
}
