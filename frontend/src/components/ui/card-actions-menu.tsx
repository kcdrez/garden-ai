import { ArrowRightIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

type Props = {
  onEdit: () => void;
  onDelete: () => void;
  onMove?: () => void;
  isDeleting?: boolean;
  label?: string;
};

export default function CardActionsMenu({ onEdit, onDelete, onMove, isDeleting = false, label }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
        aria-label={label ?? 'Actions'}
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        {onMove && (
          <DropdownMenuItem onClick={onMove}>
            <ArrowRightIcon />
            Move to Bed
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          disabled={isDeleting}
          onClick={onDelete}
        >
          <Trash2Icon />
          {isDeleting ? 'Deleting…' : 'Delete'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
