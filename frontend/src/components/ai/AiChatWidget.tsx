import { useRef, useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, X, Send, PlusIcon, CheckCircleIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/dates';
import { fetchConversations, fetchConversation, createConversation, sendMessage } from '@/api/ai';
import { queryKeys } from '@/lib/queryKeys';
import { useAiContext } from '@/hooks/useAiContext';
import type { ActionResult, SendMessageResponse } from '@/types/ai';

function actionLabel(action: ActionResult): string {
  if (action.type === 'add_plant') {
    return `Added ${action.plantName}${action.bedName ? ` to ${action.bedName}` : ''}`;
  }
  if (action.type === 'change_plant_status') {
    return `${action.plantName} is now ${action.newStatus}`;
  }
  return 'Action completed';
}

export default function AiChatWidget() {
  const context = useAiContext();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  // undefined = auto-select most recent; null = new conversation mode
  const [activeConversationId, setActiveConversationId] = useState<string | null | undefined>(undefined);
  const [input, setInput] = useState('');
  const [lastAction, setLastAction] = useState<ActionResult | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset conversation state when navigating to a different entity
  const contextKey = context ? `${context.scope}:${context.entityId}` : null;
  const prevContextKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (contextKey !== prevContextKeyRef.current) {
      prevContextKeyRef.current = contextKey;
      setActiveConversationId(undefined);
    }
  }, [contextKey]);

  const { data: conversations = [] } = useQuery({
    queryKey: queryKeys.ai.conversations(context?.scope, context?.entityId),
    queryFn: () => fetchConversations(context!.scope, context!.entityId),
    enabled: !!context && open,
  });

  // Auto-select most recent conversation when in auto mode
  useEffect(() => {
    if (activeConversationId === undefined && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const { data: activeConversation } = useQuery({
    queryKey: queryKeys.ai.conversation(activeConversationId!),
    queryFn: () => fetchConversation(activeConversationId!),
    enabled: !!activeConversationId,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      let convId = activeConversationId ?? null;
      if (!convId) {
        const conv = await createConversation(context!.scope, context!.entityId);
        convId = conv.id;
      }
      return sendMessage(convId, content);
    },
    onSuccess: (response: SendMessageResponse) => {
      const { action, ...conversation } = response;
      queryClient.setQueryData(queryKeys.ai.conversation(conversation.id), conversation);
      setActiveConversationId(conversation.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversations(context?.scope, context?.entityId) });

      if (action) {
        setLastAction(action);
        queryClient.invalidateQueries({ queryKey: queryKeys.plants.user() });
        if (action.type === 'change_plant_status') {
          queryClient.invalidateQueries({ queryKey: queryKeys.observations.byPlant(action.plantId) });
        }
      }
    },
  });

  function handleSend() {
    const content = input.trim();
    if (!content || mutation.isPending || !context) return;
    setInput('');
    setLastAction(null);
    mutation.mutate(content);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const messages = activeConversation?.messages ?? [];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          open ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
        } ${!context ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={context ? `Chat about this ${context.label.toLowerCase()}` : 'Navigate to a garden, bed, or plant to chat'}
        disabled={!context}
      >
        <Bot className="size-5" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-22 right-6 z-50 w-[400px] max-h-[600px] flex flex-col border rounded-xl shadow-xl bg-background overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-muted-foreground" />
              <span className="font-medium text-sm">AI Assistant</span>
              {context && (
                <span className="text-xs text-muted-foreground">· {context.label}</span>
              )}
            </div>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>

          {/* No context state */}
          {!context && (
            <div className="flex-1 flex items-center justify-center p-8">
              <p className="text-sm text-muted-foreground text-center">
                Navigate to a garden, bed, or plant to start chatting.
              </p>
            </div>
          )}

          {context && (
            <>
              {/* History list */}
              {conversations.length > 0 && (
                <div className="border-b shrink-0 max-h-[140px] overflow-y-auto">
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => setActiveConversationId(null)}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <PlusIcon className="size-3.5" />
                      New conversation
                    </button>
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setActiveConversationId(conv.id)}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors hover:bg-accent ${
                          activeConversationId === conv.id ? 'bg-accent font-medium' : 'text-muted-foreground'
                        }`}
                      >
                        {formatDate(conv.createdAt, true)} · {conv.messageCount} msg
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[160px]">
                {messages.length === 0 && !mutation.isPending && (
                  <p className="text-sm text-muted-foreground text-center pt-6">
                    Ask a question to get started.
                  </p>
                )}

                {messages.map((msg, i) => (
                  <div key={msg.id}>
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground whitespace-pre-wrap'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li>{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              h1: ({ children }) => <h1 className="font-semibold text-base mb-1">{children}</h1>,
                              h2: ({ children }) => <h2 className="font-semibold mb-1">{children}</h2>,
                              h3: ({ children }) => <h3 className="font-medium mb-1">{children}</h3>,
                              code: ({ children }) => (
                                <code className="bg-background/60 rounded px-1 py-0.5 font-mono text-xs">{children}</code>
                              ),
                              hr: () => <hr className="my-2 border-border" />,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                    {msg.role === 'assistant' && i === messages.length - 1 && lastAction && (
                      <div className="flex justify-start mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 px-1">
                          <CheckCircleIcon className="size-3.5 shrink-0" />
                          <span>{actionLabel(lastAction)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {mutation.isPending && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground animate-pulse">
                      Thinking…
                    </div>
                  </div>
                )}

                {mutation.isError && (
                  <p className="text-sm text-destructive text-center">
                    {getErrorMessage(mutation.error)}
                  </p>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3 flex gap-2 items-end shrink-0">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question… (Enter to send)"
                  className="resize-none"
                  rows={2}
                  disabled={mutation.isPending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || mutation.isPending}
                  size="icon"
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
