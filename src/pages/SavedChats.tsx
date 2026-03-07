import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { BookmarkCheck, MessageSquare, ExternalLink, Trash2, Search, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const SavedChats = () => {
  const { chats, toggleSaveChat, deleteChat, renameChat } = useChatHistory();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const savedChats = chats.filter((c) => c.saved && c.title.toLowerCase().includes(search.toLowerCase()));

  const handleUnsave = useCallback(async (chatId: string) => {
    await toggleSaveChat(chatId, false);
    toast.success("Removed from saved chats");
  }, [toggleSaveChat]);

  const startEditing = useCallback((chatId: string, currentTitle: string) => {
    setEditingId(chatId);
    setEditValue(currentTitle);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId || !editValue.trim()) return;
    await renameChat(editingId, editValue.trim());
    setEditingId(null);
    toast.success("Chat renamed");
  }, [editingId, editValue, renameChat]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookmarkCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Saved Chats</h1>
            <p className="text-sm text-muted-foreground">Your bookmarked conversations for future learning</p>
          </div>
        </div>

        <div className="mt-6 mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved chats..."
              className="pl-9"
            />
          </div>
        </div>

        {savedChats.length === 0 ? (
          <div className="text-center py-16">
            <BookmarkCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-1">
              {search ? "No matching saved chats" : "No saved chats yet"}
            </h3>
            <p className="text-sm text-muted-foreground/70">
              {search ? "Try a different search term" : "Save chats from AI Coaching to revisit them later for learning."}
            </p>
            {!search && (
              <Button variant="outline" className="mt-4" onClick={() => navigate("/chat")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Start a Chat
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {savedChats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === chat.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={saveEdit}>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={cancelEdit}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-sm font-medium text-foreground truncate">{chat.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        Saved · {new Date(chat.updated_at).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {editingId !== chat.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => startEditing(chat.id, chat.title)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/chat?id=${chat.id}`)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleUnsave(chat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SavedChats;
