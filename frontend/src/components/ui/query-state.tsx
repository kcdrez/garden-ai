import { Leaf } from 'lucide-react'
import { getErrorMessage } from '@/lib/errors'

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
      <Leaf className="size-8 animate-leaf-fall text-green-500" />
      <span className="text-sm">Loading…</span>
    </div>
  )
}

type QueryStateProps = {
  isLoading: boolean
  error: unknown
  isEmpty?: boolean
  emptyMessage?: string
  children: React.ReactNode
}

function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyMessage = 'Nothing here yet.',
  children,
}: QueryStateProps) {
  if (isLoading) return <LoadingSpinner />
  if (error) return <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
  if (isEmpty) return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  return <>{children}</>
}

export { QueryState, LoadingSpinner }
