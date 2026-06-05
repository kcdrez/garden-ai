import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CanvasShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CanvasShortcutsDialog({ open, onOpenChange }: CanvasShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <ShortcutSection title="Zoom">
            <Shortcut keys={['=', '+']} label="Zoom in" />
            <Shortcut keys={['-']} label="Zoom out" />
            <Shortcut keys={['?']} label="Show shortcuts" />
          </ShortcutSection>
          <ShortcutSection title="Selection">
            <Shortcut keys={['Click']} label="Select item" />
            <Shortcut keys={['Tab']} label="Next item" />
            <Shortcut keys={['Shift', 'Tab']} label="Previous item" />
            <Shortcut keys={['Esc']} label="Deselect" />
          </ShortcutSection>
          <ShortcutSection title="When selected">
            <Shortcut keys={['↑ ↓ ← →']} label="Nudge ¼ ft" />
            <Shortcut keys={['Shift', '↑↓←→']} label="Nudge 1 ft" />
            <Shortcut keys={['Del']} label="Remove item" />
            <Shortcut keys={['Letter']} label="Menu shortcuts (shown in toolbar)" />
          </ShortcutSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="flex items-center gap-1 shrink-0">
        {keys.map((k) => (
          <kbd
            key={k}
            className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] leading-none"
          >
            {k}
          </kbd>
        ))}
      </span>
    </div>
  );
}
