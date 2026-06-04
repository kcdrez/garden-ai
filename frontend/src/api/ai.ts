import { api } from './client';
import type { AiConversation, AiConversationListItem, AiScope, SendMessageResponse } from '@/types/ai';

export async function fetchConversations(scope: AiScope, entityId: string): Promise<AiConversationListItem[]> {
  const res = await api.get('/ai/conversations/', { params: { [scope]: entityId } });
  return res.data;
}

export async function fetchConversation(id: string): Promise<AiConversation> {
  const res = await api.get(`/ai/conversations/${id}/`);
  return res.data;
}

export async function createConversation(scope: AiScope, entityId: string): Promise<AiConversationListItem> {
  const res = await api.post('/ai/conversations/', { scope, [scope]: entityId });
  return res.data;
}

export async function sendMessage(conversationId: string, content: string): Promise<SendMessageResponse> {
  const res = await api.post(`/ai/conversations/${conversationId}/message/`, { content });
  return res.data;
}
