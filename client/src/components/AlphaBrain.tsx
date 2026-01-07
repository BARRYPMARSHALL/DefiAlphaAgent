import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Send, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, Message } from "@shared/schema";

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

function formatMarkdown(text: string): string {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-base mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-semibold text-lg mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');
  
  html = html.replace(/\n\n/g, '</p><p class="my-2">');
  html = html.replace(/\n/g, '<br/>');
  
  return `<p class="my-2">${html}</p>`;
}

export function AlphaBrain() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: currentConversation, refetch: refetchConversation } = useQuery<ConversationWithMessages>({
    queryKey: ["/api/conversations", currentConversationId],
    enabled: !!currentConversationId,
  });

  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations", { title: "Alpha Brain Chat" });
      return res.json();
    },
    onSuccess: (data: Conversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setCurrentConversationId(data.id);
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setCurrentConversationId(null);
    },
  });

  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    let convId = currentConversationId;
    if (!convId) {
      const newConv = await createConversation.mutateAsync();
      convId = newConv.id;
    }

    const userMessage = inputValue;
    setInputValue("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setStreamingContent(accumulated);
              }
              if (data.done) {
                setIsStreaming(false);
                setStreamingContent("");
                refetchConversation();
              }
              if (data.error) {
                console.error("Stream error:", data.error);
                setIsStreaming(false);
              }
            } catch (e) {
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentConversation?.messages, streamingContent]);

  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  const messages = currentConversation?.messages || [];

  return (
    <Card className="h-full flex flex-col border-l rounded-none">
      <CardHeader className="py-3 px-4 border-b shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-chart-4" />
            <CardTitle className="text-base">Alpha Brain</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => createConversation.mutate()}
              disabled={createConversation.isPending}
              data-testid="button-new-chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {currentConversationId && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteConversation.mutate(currentConversationId)}
                disabled={deleteConversation.isPending}
                data-testid="button-delete-chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          AI-powered DeFi yield advisor with real-time pool data
        </p>
      </CardHeader>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <CardContent className="p-4 space-y-4">
          {messages.length === 0 && !streamingContent && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-2">Ask Alpha Brain anything</p>
              <p className="text-xs">Try: "Why is the top pool ranked #1?"</p>
              <p className="text-xs">"Best pools for low IL risk?"</p>
              <p className="text-xs">"How should I allocate $10k?"</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              data-testid={`message-${msg.role}-${msg.id}`}
            >
              <div
                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-chart-4 text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                  />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-lg px-3 py-2 text-sm bg-muted">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(streamingContent) }}
                />
              </div>
            </div>
          )}

          {isStreaming && !streamingContent && (
            <div className="flex justify-start">
              <div className="rounded-lg px-3 py-2 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </CardContent>
      </ScrollArea>

      <Separator />

      <div className="p-3 shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about yields, risks, strategies..."
            className="min-h-[60px] max-h-[120px] resize-none text-sm"
            disabled={isStreaming}
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!inputValue.trim() || isStreaming}
            data-testid="button-send-message"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
