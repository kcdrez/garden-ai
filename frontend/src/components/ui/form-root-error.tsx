import { AlertCircleIcon } from 'lucide-react';

type Props = {
  message: string | undefined;
};

export function FormRootError({ message }: Props) {
  if (!message) return null;

  return (
    <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertCircleIcon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
