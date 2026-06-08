import { api } from './client';
import type { AiConversation, AiConversationListItem, AiScope, SendMessageResponse } from '@/types/ai';

export async function fetchConversations(scope: AiScope, entityId: string): Promise<AiConversationListItem[]> {
  const { data } = await api.get<AiConversationListItem[]>('/ai/conversations/', { params: { [scope]: entityId } });
  return data;
}

export async function fetchConversation(id: string): Promise<AiConversation> {
  const { data } = await api.get<AiConversation>(`/ai/conversations/${id}/`);
  return data;
}

export async function createConversation(scope: AiScope, entityId: string): Promise<AiConversationListItem> {
  const { data } = await api.post<AiConversationListItem>('/ai/conversations/', { scope, [scope]: entityId });
  return data;
}

export async function sendMessage(conversationId: string, content: string): Promise<SendMessageResponse> {
  const { data } = await api.post<SendMessageResponse>(`/ai/conversations/${conversationId}/message/`, { content });
  return data;
}
