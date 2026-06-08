import { api } from '@/api/client'

export async function fetchBackendVersion(): Promise<string> {
  const { data } = await api.get<{ version: string }>('/version/')
  return data.version
}
