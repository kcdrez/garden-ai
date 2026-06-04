export type AiScope = 'garden' | 'bed' | 'plant';

export type ActionType = 'add_plant' | 'change_plant_status';

export interface ActionResult {
  type: ActionType;
  plantId: string;
  bedId: string;
  plantName: string;
  bedName?: string;
  oldStatus?: string;
  newStatus?: string;
}

export interface SendMessageResponse extends AiConversation {
  action?: ActionResult;
}

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
