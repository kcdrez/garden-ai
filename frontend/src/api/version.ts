import { api } from '@/api/client'

export async function fetchBackendVersion(): Promise<string> {
  const res = await api.get<{ version: string }>('/version/')
  return res.data.version
}
