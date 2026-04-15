import { useState, useRef, useEffect, useCallback } from "react";
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
import { type ChatMessage, type SourceReference } from "@/lib/chat-stream";
import { SourceLinks } from "@/components/chat/SourceLinks";
import { useChatHistory } from "@/hooks/useChatHistory";
import { PlatformResponse } from "@/components/chat/PlatformResponse";
import { useLabs } from "@/hooks/useLabs";
import { useUserContextFilters } from "@/hooks/useUserContextFilters";
import { useContextFilterOptions } from "@/hooks/useContextFilterOptions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const SUGGESTIONS = [
  "How do I get started with product adoption strategies?",
  "Explain RAG architecture in simple terms",
  "What are best practices for onboarding enterprise users?",
  "Help me create a learning path for my team",
];

const roleOptions: UserRole[] = ["nocode", "lowcode", "prodeveloper", "architect", "admin"];
const ROLE_COLORS: Record<UserRole, string> = {
  nocode: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  lowcode: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  prodeveloper: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  architect: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  admin: "from-red-500/10 to-red-500/5 border-red-500/20",
};

function stripMetaTags(content: string): string {
  return content
    .replace(/\n---\n📚[\s\S]*$/m, "")
    .replace(/\n📚 \*\*Sources[:\s]*\*\*[\s\S]*$/m, "")
    .replace(/\[IS_LAB:(true|false)\]/gi, "")
    .trim();
}

type DisplayMessage = ChatMessage & { comparing?: boolean; sources?: SourceReference[] };

const Chat = () => {
  const { user } = useAuth();
  const { role, setRole } = useUserRole();
  const { functionalArea, industry, setFunctionalArea, setIndustry } = useUserContextFilters();
  const { functionalAreas, industries, loading: filtersLoading } = useContextFilterOptions();
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

  const activeChat = chats.find((c) => c.id === activeChatId);

  const [searchParams, setSearchParams] = useSearchParams();

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

  useEffect(() => {
    const chatIdFromUrl = searchParams.get("id");
    if (chatIdFromUrl && chatIdFromUrl !== activeChatId && !historyLoading) {
      // We don't strictly need to check chatExists if we trust the URL, 
      // but let's be safe and just try to load it.
      selectChat(chatIdFromUrl);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, historyLoading, activeChatId, selectChat, setSearchParams]);

  // Listen for new-chat event from sidebar
  useEffect(() => {
    const handler = () => {
      setActiveChatId(null);
      setMessages([]);
      setComparingIndex(null);
      setInput("");
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

    if (!role) {
      toast.info("Tip: Select a persona in the sidebar for personalized platform comparisons!");
    }

    pendingChatIdRef.current = chatId;
    pendingMessagesRef.current = newMessages.map(({ role, content }) => ({ role, content }));
    setComparingIndex(newMessages.length);
  };

  const handlePick = async (content: string, _model: string, sources?: SourceReference[]) => {
    const chatId = pendingChatIdRef.current;
    content = content.replace(/\[PERSONA_DETECTED:\w+\]/g, "").trim();
    const assistantMsg: DisplayMessage = { role: "assistant", content, sources };
    setMessages((prev) => [...prev, assistantMsg]);
    setComparingIndex(null);
    setIsLoading(false);
    if (chatId) await saveMessage(chatId, { role: "assistant", content });
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
      {/* Minimal top bar for active chat */}
      {activeChatId && activeChat && (
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-border/50">
          <h3 className="text-sm font-medium truncate text-foreground/70">{activeChat.title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleSave}
            className={activeChat.saved ? "text-primary" : "text-muted-foreground hover:text-foreground"}
          >
            {activeChat.saved ? <BookmarkCheck className="h-4 w-4 mr-1.5" /> : <Bookmark className="h-4 w-4 mr-1.5" />}
            <span className="hidden sm:inline">{activeChat.saved ? "Saved" : "Save"}</span>
          </Button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {/* Sticky context bar */}
        <div className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="w-full px-4 sm:px-8 lg:px-12 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mr-1">
                Context
              </span>

              {/* Persona */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={[
                      "flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-b border",
                      role ? ROLE_COLORS[role] : "from-muted/60 to-muted/20 border-dashed border-border",
                      "hover:opacity-90 transition-opacity min-w-[180px]",
                    ].join(" ")}
                  >
                    <span className="text-xs font-semibold text-foreground truncate text-left">
                      {role ? ROLE_LABELS[role] : "Select Persona"}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => setRole(null)}>Select Persona</DropdownMenuItem>
                  {roleOptions.map((r) => (
                    <DropdownMenuItem key={r} onClick={() => setRole(r)}>
                      {ROLE_LABELS[r]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Functional Area */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-b border from-muted/60 to-muted/20 border-dashed border-border hover:opacity-90 transition-opacity min-w-[200px]">
                    <span className="text-xs font-semibold text-foreground truncate text-left">
                      {functionalAreas.find((f) => f.key === functionalArea)?.display_name || "All Functional Areas"}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuItem onClick={() => setFunctionalArea(null)}>All Functional Areas</DropdownMenuItem>
                  {filtersLoading && functionalAreas.length === 0 && <DropdownMenuItem disabled>Loading...</DropdownMenuItem>}
                  {functionalAreas.map((opt) => (
                    <DropdownMenuItem key={opt.key} onClick={() => setFunctionalArea(opt.key)}>
                      {opt.display_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Industry */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-b border from-muted/60 to-muted/20 border-dashed border-border hover:opacity-90 transition-opacity min-w-[180px]">
                    <span className="text-xs font-semibold text-foreground truncate text-left">
                      {industries.find((i) => i.key === industry)?.display_name || "All Industries"}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => setIndustry(null)}>All Industries</DropdownMenuItem>
                  {filtersLoading && industries.length === 0 && <DropdownMenuItem disabled>Loading...</DropdownMenuItem>}
                  {industries.map((opt) => (
                    <DropdownMenuItem key={opt.key} onClick={() => setIndustry(opt.key)}>
                      {opt.display_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-8 lg:px-12 py-6 space-y-5">
          {messages.length === 0 && comparingIndex === null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center pt-[15vh]"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <img src={useBoxLogo} alt="UseBox" className="h-7 w-7" />
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
                {SUGGESTIONS.map((s) => (
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
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted/50 rounded-bl-sm"
                    }`}
                >
                  {msg.role === "assistant" ? (
                    <>
                      <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-background [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-background [&_pre]:rounded-lg [&_pre]:p-3 [&_a]:text-primary [&_a]:no-underline hover:[&_a]:underline [&_li]:text-foreground/70 [&_p]:text-foreground">
                        <ReactMarkdown>{stripMetaTags(msg.content)}</ReactMarkdown>
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <SourceLinks sources={msg.sources} />
                      )}
                    </>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {comparingIndex !== null && (
            <PlatformResponse
              messages={pendingMessagesRef.current}
              role={role}
              onPick={handlePick}
              onError={handleCompareError}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area — centered, ChatGPT-style */}
      <div className="shrink-0 pb-4 pt-2 px-4">
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
              placeholder="Message UseBox..."
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
            UseBox may produce inaccurate information. Verify important details.
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
