export type AiScope = 'garden' | 'bed' | 'plant';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  scope: AiScope;
  garden: string | null;
  bed: string | null;
  plant: string | null;
  messages: AiMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AiConversationListItem {
  id: string;
  scope: AiScope;
  garden: string | null;
  bed: string | null;
  plant: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}
