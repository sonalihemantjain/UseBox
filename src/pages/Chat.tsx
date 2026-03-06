import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bookmark, BookmarkCheck } from "lucide-react";
import useBoxLogo from "@/assets/usebox-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { type ChatMessage } from "@/lib/chat-stream";
import { ChatHistorySidebar } from "@/components/ChatHistorySidebar";
import { useChatHistory } from "@/hooks/useChatHistory";
import { DualModelResponse } from "@/components/chat/DualModelResponse";

const SUGGESTIONS = [
  "How do I get started with product adoption strategies?",
  "Explain RAG architecture in simple terms",
  "What are best practices for onboarding enterprise users?",
  "Help me create a learning path for my team",
];

type DisplayMessage = ChatMessage & { comparing?: boolean };

const Chat = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { chats, createChat, renameChat, deleteChat, toggleSaveChat, loadMessages, saveMessage, autoTitle } = useChatHistory();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [comparingIndex, setComparingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingChatIdRef = useRef<string | null>(null);
  const pendingMessagesRef = useRef<ChatMessage[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const activeChat = chats.find((c) => c.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, comparingIndex]);

  const selectChat = useCallback(async (chatId: string) => {
    setActiveChatId(chatId);
    setComparingIndex(null);
    const msgs = await loadMessages(chatId);
    setMessages(msgs);
  }, [loadMessages]);

  const handleNewChat = useCallback(async () => {
    const id = await createChat();
    if (id) {
      setActiveChatId(id);
      setMessages([]);
      setComparingIndex(null);
    }
  }, [createChat]);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    await deleteChat(chatId);
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMessages([]);
      setComparingIndex(null);
    }
  }, [deleteChat, activeChatId]);

  const handleToggleSave = useCallback(async () => {
    if (!activeChatId || !activeChat) return;
    if (activeChat.saved) {
      // Unsave directly
      await toggleSaveChat(activeChatId, false);
      toast.success("Chat removed from saved");
    } else {
      // Open dialog to let user name it
      setSaveName(activeChat.title);
      setSaveDialogOpen(true);
    }
  }, [activeChatId, activeChat, toggleSaveChat]);

  const confirmSave = useCallback(async () => {
    if (!activeChatId) return;
    const name = saveName.trim();
    if (name) {
      await renameChat(activeChatId, name);
    }
    await toggleSaveChat(activeChatId, true);
    setSaveDialogOpen(false);
    toast.success("Chat saved for learning!");
  }, [activeChatId, saveName, renameChat, toggleSaveChat]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = await createChat();
      if (!chatId) { toast.error("Failed to create chat"); return; }
      setActiveChatId(chatId);
    }

    const userMsg: DisplayMessage = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    await saveMessage(chatId, userMsg);

    if (messages.length === 0) {
      autoTitle(chatId, content.trim());
    }

    // Store for the dual model component
    pendingChatIdRef.current = chatId;
    pendingMessagesRef.current = newMessages.map(({ role, content }) => ({ role, content }));
    setComparingIndex(newMessages.length); // the index where comparison will appear
  };

  const handlePick = async (content: string, _model: string) => {
    const chatId = pendingChatIdRef.current;
    const assistantMsg: DisplayMessage = { role: "assistant", content };
    setMessages((prev) => [...prev, assistantMsg]);
    setComparingIndex(null);
    setIsLoading(false);

    if (chatId) {
      await saveMessage(chatId, { role: "assistant", content });
    }
  };

  const handleCompareError = (err: string) => {
    toast.error(err);
    setIsLoading(false);
    setComparingIndex(null);
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
      <ChatHistorySidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelect={selectChat}
        onNew={handleNewChat}
        onRename={renameChat}
        onDelete={handleDeleteChat}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {activeChatId && activeChat && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-border bg-card/40 backdrop-blur-sm">
            <h3 className="text-sm font-medium truncate text-foreground">{activeChat.title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleSave}
              className={activeChat.saved ? "text-primary" : "text-muted-foreground hover:text-foreground"}
            >
              {activeChat.saved ? <BookmarkCheck className="h-4 w-4 mr-1.5" /> : <Bookmark className="h-4 w-4 mr-1.5" />}
              {activeChat.saved ? "Saved" : "Save for Learning"}
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
            {messages.length === 0 && comparingIndex === null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center pt-12 sm:pt-20"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <img src={useBoxLogo} alt="UseBox" className="h-8 w-8" />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
                  Hey! I'm your AI Coach 👋
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Ask me anything — I'll generate responses from <strong>two AI models</strong> so you can compare and pick the best one.
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
                      <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-secondary [&_pre]:rounded-lg [&_pre]:p-3 [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_li]:text-muted-foreground [&_p]:text-card-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Dual model comparison */}
            {comparingIndex !== null && (
              <DualModelResponse
                messages={pendingMessagesRef.current}
                role={role}
                onPick={handlePick}
                onError={handleCompareError}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-border bg-card/60 backdrop-blur-xl shrink-0">
          <form onSubmit={handleSubmit} className="container mx-auto max-w-4xl px-4 sm:px-6 py-4">
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
              Responses from two AI models — compare and pick the best one.
            </p>
          </form>
        </div>
      </div>

      {/* Save with custom name dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Save for Learning</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Give this chat a name</Label>
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. RAG Architecture Notes"
                onKeyDown={(e) => { if (e.key === "Enter") confirmSave(); }}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
              <Button onClick={confirmSave} disabled={!saveName.trim()}>
                <BookmarkCheck className="h-4 w-4 mr-1.5" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
