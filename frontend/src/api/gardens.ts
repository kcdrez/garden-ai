import { api } from './client';
import type { Garden } from '../types/gardens';

export async function fetchGardens(): Promise<Garden[]> {
  const res = await api.get('/gardens/');
  return res.data ?? [];
}

export async function createGarden(data: {
  name: string;
  description?: string;
}): Promise<Garden> {
  const res = await api.post('/gardens/', data);
  return res.data;
}

export async function deleteGarden(id: string): Promise<void> {
  await api.delete(`/gardens/${id}/`);
}
