import { useRef, useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/errors';
import { fetchConversations, fetchConversation, createConversation, sendMessage } from '@/api/ai';
import type { AiConversation, AiScope } from '@/types/ai';

type Props = {
  scope: AiScope;
  entityId: string;
};

export default function AiChat({ scope, entityId }: Props) {
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['ai-conversations', scope, entityId],
    queryFn: () => fetchConversations(scope, entityId),
  });

  // Auto-select most recent conversation (list ordered by -created_at)
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const { data: activeConversation } = useQuery({
    queryKey: ['ai-conversation', activeConversationId],
    queryFn: () => fetchConversation(activeConversationId!),
    enabled: !!activeConversationId,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      let convId = activeConversationId;
      if (!convId) {
        const conv = await createConversation(scope, entityId);
        convId = conv.id;
      }
      return sendMessage(convId, content);
    },
    onSuccess: (conversation: AiConversation) => {
      queryClient.setQueryData(['ai-conversation', conversation.id], conversation);
      setActiveConversationId(conversation.id);
      queryClient.invalidateQueries({ queryKey: ['ai-conversations', scope, entityId] });
    },
  });

  function handleSend() {
    const content = input.trim();
    if (!content || mutation.isPending) return;
    setInput('');
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
    <div className="border rounded-lg overflow-hidden">
      {activeConversationId && (
        <div className="flex justify-end px-3 py-2 border-b">
          <Button variant="ghost" size="sm" onClick={() => setActiveConversationId(null)}>
            New conversation
          </Button>
        </div>
      )}

      <div className="min-h-[160px] max-h-[400px] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !mutation.isPending && (
          <p className="text-sm text-muted-foreground text-center pt-6">
            Ask a question to get started.
          </p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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

      <div className="border-t p-3 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
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
    </div>
  );
}
