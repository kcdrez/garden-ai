import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontalIcon, LeafIcon, Trash2Icon } from 'lucide-react';
import type { Garden } from '@/types/gardens';
import { deleteGarden } from '@/api/gardens';
import { buttonVariants } from '@/components/ui/button';
import { formatDate } from '@/lib/dates';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

type Props = {
  garden: Garden;
};

export default function GardenItem({ garden }: Props) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteGarden(garden.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gardens'] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LeafIcon className="size-4 text-primary" />
          {garden.name}
        </CardTitle>
        {garden.description && (
          <CardDescription className="line-clamp-2">
            {garden.description}
          </CardDescription>
        )}
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
              aria-label="Garden actions"
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                <Trash2Icon />
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardFooter className="mt-auto">
        <span className="text-xs text-muted-foreground">
          Created {formatDate(garden.created_at)}
        </span>
      </CardFooter>
    </Card>
  );
}
