import { useQuery } from '@tanstack/react-query'
import { fetchBackendVersion } from '@/api/version'

export default function Footer() {
  const feVersion = import.meta.env.VITE_APP_VERSION ?? 'dev'

  const { data: beVersion } = useQuery({
    queryKey: ['version'],
    queryFn: fetchBackendVersion,
    staleTime: Infinity,
    retry: false,
  })

  return (
    <footer className="mt-8 flex justify-center pb-4">
      <span className="group relative cursor-default text-xs text-muted-foreground tabular-nums">
        v{feVersion}
        {beVersion !== undefined && (
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            Client: {feVersion} &middot; Server: {beVersion}
          </span>
        )}
      </span>
    </footer>
  )
}
