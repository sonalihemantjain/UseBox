import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { streamChat, type ChatMessage } from "@/lib/chat-stream";
import { ChatHistorySidebar } from "@/components/ChatHistorySidebar";
import { useChatHistory } from "@/hooks/useChatHistory";

const SUGGESTIONS = [
  "How do I get started with product adoption strategies?",
  "Explain RAG architecture in simple terms",
  "What are best practices for onboarding enterprise users?",
  "Help me create a learning path for my team",
];

const Chat = () => {
  const { user } = useAuth();
  const { chats, createChat, renameChat, deleteChat, loadMessages, saveMessage, autoTitle } = useChatHistory();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectChat = useCallback(async (chatId: string) => {
    setActiveChatId(chatId);
    const msgs = await loadMessages(chatId);
    setMessages(msgs);
  }, [loadMessages]);

  const handleNewChat = useCallback(async () => {
    const id = await createChat();
    if (id) {
      setActiveChatId(id);
      setMessages([]);
    }
  }, [createChat]);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    await deleteChat(chatId);
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMessages([]);
    }
  }, [deleteChat, activeChatId]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    let chatId = activeChatId;

    // Auto-create chat if none active
    if (!chatId) {
      chatId = await createChat();
      if (!chatId) { toast.error("Failed to create chat"); return; }
      setActiveChatId(chatId);
    }

    const userMsg: ChatMessage = { role: "user", content: content.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Save user message
    await saveMessage(chatId, userMsg);

    // Auto-title on first message
    if (messages.length === 0) {
      autoTitle(chatId, content.trim());
    }

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    const finalChatId = chatId;

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsertAssistant,
        onDone: async () => {
          setIsLoading(false);
          if (assistantSoFar) {
            await saveMessage(finalChatId, { role: "assistant", content: assistantSoFar });
          }
        },
        onError: (err) => {
          toast.error(err);
          setIsLoading(false);
        },
      });
    } catch {
      toast.error("Failed to connect to AI coach");
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] bg-background">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelect={selectChat}
        onNew={handleNewChat}
        onRename={renameChat}
        onDelete={handleDeleteChat}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center pt-12 sm:pt-20"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
                  Hey! I'm your AI Coach 👋
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-10">
                  Ask me anything about product adoption, learning strategies, or technical concepts.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-secondary [&_pre]:rounded-lg [&_pre]:p-3 [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_li]:text-muted-foreground [&_p]:text-card-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card/60 backdrop-blur-xl shrink-0">
          <form onSubmit={handleSubmit} className="container mx-auto max-w-3xl px-4 sm:px-6 py-4">
            <div className="flex items-end gap-3 bg-secondary rounded-xl px-4 py-3 border border-border focus-within:border-primary/40 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI coach..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[20px] max-h-[120px]"
                style={{ height: "auto", overflow: "hidden" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 120) + "px";
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="shrink-0 h-8 w-8 rounded-lg glow-gold disabled:opacity-40 disabled:shadow-none"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              AI responses may not always be accurate. Verify important information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
