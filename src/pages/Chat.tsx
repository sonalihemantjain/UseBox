import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bookmark, BookmarkCheck } from "lucide-react";
import useBoxLogo from "@/assets/usebox-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, ROLE_LABELS, type UserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type ChatMessage, type SourceReference } from "@/lib/chat-stream";
import { useChatHistory } from "@/hooks/useChatHistory";
import { PlatformResponse } from "@/components/chat/PlatformResponse";
import { useLabs } from "@/hooks/useLabs";
import { useUserContextFilters } from "@/hooks/useUserContextFilters";
import { useSuggestions } from "@/hooks/useSuggestions";
import { api } from "@/lib/api";
import { usePageActions } from "@/context/PageActionsContext";

const DEFAULT_COMPARE_PLATFORMS = ["openai", "google", "microsoft"];

function toPlatformLabel(name: string): string {
  const normalized = (name || "").trim().toLowerCase();
  if (normalized === "openai") return "OpenAI";
  if (normalized === "google") return "Google";
  if (normalized === "microsoft") return "Microsoft";
  if (normalized === "anthropic") return "Anthropic";
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function stripMetaTags(content: string): string {
  return content
    .replace(/\n---\n📚[\s\S]*$/m, "")
    .replace(/\n📚 \*\*Sources[:\s]*\*\*[\s\S]*$/m, "")
    .replace(/\[IS_LAB:(true|false)\]/gi, "")
    .trim();
}

type DisplayMessage = ChatMessage & { 
  isComparing?: boolean; 
  summaryText?: string; 
  summaryPlatforms?: string[];
  initialActivePlatform?: string | null;
  selectedPlatform?: string | null;
  sources?: SourceReference[];
};

const Chat = () => {
  const { user } = useAuth();
  const { setPageAction } = usePageActions();
  const { role, setRole } = useUserRole();
  const { functionalArea, industry } = useUserContextFilters();
  const { suggestions, loading: suggestionsLoading } = useSuggestions(
    industry,
    functionalArea,
    role ? ROLE_LABELS[role] : null
  );
  const navigate = useNavigate();
  const { generateLab } = useLabs({ autoFetch: false });
  const { chats, loading: historyLoading, createChat, renameChat, deleteChat, toggleSaveChat, loadMessages, saveMessage, autoTitle } = useChatHistory();
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
  const [lockedPlatform, setLockedPlatform] = useState<string | null>(null);
  const [followups, setFollowups] = useState<string[]>([]);
  const [followupsLoading, setFollowupsLoading] = useState(false);

  const activeChat = chats.find((c) => c.id === activeChatId);

  const [searchParams, setSearchParams] = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, comparingIndex]);

  useEffect(() => {
    if (activeChatId) localStorage.setItem("usebox_active_chat_id", activeChatId);
    else localStorage.removeItem("usebox_active_chat_id");
    window.dispatchEvent(new Event("usebox-active-chat-changed"));
  }, [activeChatId]);

  const selectChat = useCallback(async (chatId: string) => {
    setActiveChatId(chatId);
    setComparingIndex(null);
    const msgs = await loadMessages(chatId);
    setMessages(msgs);
    // Try to find the last picked platform in history to re-lock it
    const lastAssistant = msgs.slice().reverse().find(m => m.role === 'assistant' && m.selectedPlatform);
    setLockedPlatform(lastAssistant?.selectedPlatform || null);
  }, [loadMessages]);

  useEffect(() => {
    if (historyLoading) return;

    const chatIdFromUrl = searchParams.get("id");

    if (chatIdFromUrl && chatIdFromUrl !== activeChatId) {
      selectChat(chatIdFromUrl);
      setSearchParams({}, { replace: true });
      return;
    }

    // Restore last active chat when navigating back to /chat
    if (!activeChatId && !chatIdFromUrl) {
      const savedId = localStorage.getItem("usebox_active_chat_id");
      if (savedId) selectChat(savedId);
    }
  }, [searchParams, historyLoading, activeChatId, selectChat, setSearchParams]);

  // Listen for new-chat event from sidebar
  useEffect(() => {
    const handler = () => {
      setActiveChatId(null);
      setMessages([]);
      setComparingIndex(null);
      setInput("");
      setLockedPlatform(null);
      setFollowups([]);
      setFollowupsLoading(false);
    };
    window.addEventListener("usebox-new-chat", handler);
    return () => window.removeEventListener("usebox-new-chat", handler);
  }, []);

  const handleToggleSave = useCallback(async () => {
    if (!activeChatId || !activeChat) return;
    if (activeChat.saved) {
      await toggleSaveChat(activeChatId, false);
      toast.success("Chat removed from saved");
    } else {
      setSaveName(activeChat.title);
      setSaveDialogOpen(true);
    }
  }, [activeChatId, activeChat, toggleSaveChat]);

  // Inject Save button into DomainBar via context
  useEffect(() => {
    if (!activeChatId || !activeChat) {
      setPageAction(null);
      return;
    }
    const node: ReactNode = (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleSave}
        className={activeChat.saved ? "text-primary" : "text-muted-foreground hover:text-foreground"}
      >
        {activeChat.saved ? <BookmarkCheck className="h-4 w-4 mr-1.5" /> : <Bookmark className="h-4 w-4 mr-1.5" />}
        <span>{activeChat.saved ? "Saved" : "Save"}</span>
      </Button>
    );
    setPageAction(node);
    return () => setPageAction(null);
  }, [activeChatId, activeChat, handleToggleSave, setPageAction]);

  const confirmSave = useCallback(async () => {
    if (!activeChatId) return;
    const name = saveName.trim();
    if (name) await renameChat(activeChatId, name);
    await toggleSaveChat(activeChatId, true);
    setSaveDialogOpen(false);
    toast.success("Chat saved for learning!");
  }, [activeChatId, saveName, renameChat, toggleSaveChat]);

  const handlePersonaDetection = useCallback((content: string, chatId: string) => {
    let cleanContent = content;
    const personaMatch = content.match(/\[PERSONA_DETECTED:(\w+)\]/);
    if (personaMatch) {
      const detected = personaMatch[1] as UserRole;
      if (detected in ROLE_LABELS) {
        setRole(detected);
        toast.success(`Persona detected: ${ROLE_LABELS[detected]}! Your experience is now personalized.`);
      }
      cleanContent = content.replace(/\[PERSONA_DETECTED:\w+\]/g, "").trim();
    }
    if (cleanContent !== content) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return [...prev.slice(0, -1), { role: "assistant", content: cleanContent }];
        }
        return prev;
      });
    }
    saveMessage(chatId, { role: "assistant", content: cleanContent });
  }, [setRole, saveMessage]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    if (!role) {
      toast.warning("Please select a persona before sending a message.");
      return;
    }
    // Clear followups once user continues the conversation
    setFollowups([]);
    setFollowupsLoading(false);

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

    pendingChatIdRef.current = chatId;
    pendingMessagesRef.current = newMessages.map(({ role, content }) => ({ role, content }));
    try {
      if (lockedPlatform) {
        // Skip summary and go straight to the locked platform
        const assistantMsg: DisplayMessage = {
          role: "assistant",
          content: "",
          isComparing: true, // We use this to trigger PlatformResponse in one-tab mode
          summaryText: "", 
          summaryPlatforms: [lockedPlatform],
          selectedPlatform: lockedPlatform,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        return;
      }

      const summary = await api.getChatPlatformsSummary({
        messages: pendingMessagesRef.current,
        role,
        userId: user?.id || null,
        functionalArea,
        industry,
      });

      const assistantMsg: DisplayMessage = {
        role: "assistant",
        content: "",
        isComparing: true,
        summaryText: summary.summary || "",
        summaryPlatforms: summary.platforms || [],
        initialActivePlatform: null,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Save summary immediately so reopening the chat always shows something
      if (summary.summary) {
        saveMessage(chatId, { role: "assistant", content: summary.summary });
      }
    } catch (e) {
      console.error("Failed to load summary:", e);
      toast.error("Failed to load summary");
    } finally {
      setIsLoading(false);
    }
  };

  // Platform selection happens inside the platform tabs (lazy-loaded per tab).

  const handlePick = async (content: string, platform: string, sources?: SourceReference[]) => {
    const chatId = pendingChatIdRef.current;
    content = content.replace(/\[PERSONA_DETECTED:\w+\]/g, "").trim();
    
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.isComparing) {
        return [
          ...prev.slice(0, -1),
          { ...last, isComparing: false, content, sources, selectedPlatform: platform }
        ];
      }
      return prev;
    });

    setIsLoading(false);
    setLockedPlatform(platform);
    if (chatId) await saveMessage(chatId, { role: "assistant", content, selectedPlatform: platform });

    // Fetch follow-up questions...
    try {
      setFollowupsLoading(true);
      const lastUserPrompt = pendingMessagesRef.current.slice().reverse().find(m => m.role === 'user')?.content || '';
      const res = await api.getChatFollowups({ userId: user?.id, prompt: lastUserPrompt, pickedAnswer: content });
      setFollowups(res.questions || []);
    } catch (e) {
      console.error("Failed to load followups", e);
      setFollowups([]);
    } finally {
      setFollowupsLoading(false);
    }
  };

  const handleCompareError = (err: string) => {
    toast.error(err);
    setIsLoading(false);
    setComparingIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate user is logged in
    if (!user?.id) {
      toast.error('Please log in to use the chat', {
        description: 'You need to be logged in to send messages and create labs.',
      });
      return;
    }
    
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-6 space-y-5">
          {messages.length === 0 && comparingIndex === null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center pt-[15vh]"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <img src={useBoxLogo} alt="Usebox" className="h-7 w-7" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                What can I help with?
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8">
                {role
                  ? <>Responses from multiple platforms — compare and pick the best one.</>
                  : <>Select a persona in the sidebar to get personalized platform comparisons.</>
                }
              </p>
              <div className="grid sm:grid-cols-2 gap-2.5 max-w-lg mx-auto">
                {suggestionsLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[52px] rounded-xl border border-border bg-secondary/30 animate-pulse"
                      />
                    ))
                  : suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-left text-sm px-4 py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all text-muted-foreground hover:text-foreground"
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
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm px-4 py-3"
                    : msg.isComparing ? "bg-card border border-border p-5 rounded-bl-sm w-full" : "bg-muted/50 rounded-bl-sm px-4 py-3"
                    }`}
                >
                  {msg.role === "assistant" ? (
                    msg.isComparing || (msg.summaryPlatforms && msg.summaryPlatforms.length > 0) ? (
                      <PlatformResponse
                        messages={pendingMessagesRef.current}
                        platforms={msg.summaryPlatforms || []}
                        role={role}
                        initialActivePlatformName={msg.selectedPlatform || null}
                        allowPick={msg.isComparing && (msg.summaryPlatforms?.length || 0) > 1}
                        onPick={handlePick}
                        onError={handleCompareError}
                        autoStart={msg.isComparing ? (msg.summaryPlatforms?.length === 1) : true}
                        finalContent={msg.content}
                        summaryText={msg.summaryText}
                        followups={i === messages.length - 1 ? followups : []}
                        followupsLoading={i === messages.length - 1 ? followupsLoading : false}
                        onFollowupClick={sendMessage}
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-background [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-background [&_pre]:rounded-lg [&_pre]:p-3 [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_li]:text-foreground/70 [&_p]:text-foreground [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_tr:nth-child(even)_td]:bg-muted/20">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && !messages.some(m => m.isComparing) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground shadow-sm border border-border/40">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="animate-pulse font-medium">Thinking...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area — centered, ChatGPT-style */}
      <div className="shrink-0 pb-4 pt-2 px-4 sm:px-8 lg:px-12">
        {!role && messages.length > 0 && (
          <div className="w-full mb-2 px-4 py-1.5 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center gap-2">
            <span className="text-[11px] font-medium text-primary">
              Select a persona in the sidebar to enable platform comparison
            </span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex items-end gap-2 bg-muted/40 rounded-2xl px-4 py-3 border border-border/60 focus-within:border-primary/40 focus-within:bg-muted/60 transition-all shadow-sm">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Usebox..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[24px] max-h-[120px]"
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
              className="shrink-0 h-8 w-8 rounded-lg disabled:opacity-30"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground/60 mt-2">
            Usebox may produce inaccurate information. Verify important details.
          </p>
        </form>
      </div>

      {/* Save dialog */}
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
