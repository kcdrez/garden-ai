import { api } from './client';
import type { Garden } from '@/types/gardens';

type GardenPayload = Partial<Pick<Garden, 'name' | 'description' | 'length' | 'width' | 'unit' | 'orientation'>>;

export async function fetchGardens(): Promise<Garden[]> {
  const { data } = await api.get<Garden[]>('/gardens/');
  return data ?? [];
}

export async function fetchGarden(id: string): Promise<Garden> {
  const { data } = await api.get<Garden>(`/gardens/${id}/`);
  return data;
}

export async function createGarden(payload: GardenPayload): Promise<Garden> {
  const { data } = await api.post<Garden>('/gardens/', payload);
  return data;
}

export async function updateGarden(id: string, payload: GardenPayload): Promise<Garden> {
  const { data } = await api.patch<Garden>(`/gardens/${id}/`, payload);
  return data;
}

export async function deleteGarden(id: string): Promise<void> {
  await api.delete(`/gardens/${id}/`);
}
