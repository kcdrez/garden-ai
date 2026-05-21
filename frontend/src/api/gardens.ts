import { api } from './client';
import type { Garden } from '@/types/gardens';

type GardenPayload = Partial<Pick<Garden, 'name' | 'description' | 'length' | 'width' | 'unit'>>;

export async function fetchGardens(): Promise<Garden[]> {
  const res = await api.get('/gardens/');
  return res.data ?? [];
}

export async function fetchGarden(id: string): Promise<Garden> {
  const res = await api.get(`/gardens/${id}/`);
  return res.data;
}

export async function createGarden(data: GardenPayload): Promise<Garden> {
  const res = await api.post('/gardens/', data);
  return res.data;
}

export async function updateGarden(id: string, data: GardenPayload): Promise<Garden> {
  const res = await api.patch(`/gardens/${id}/`, data);
  return res.data;
}

export async function deleteGarden(id: string): Promise<void> {
  await api.delete(`/gardens/${id}/`);
}
