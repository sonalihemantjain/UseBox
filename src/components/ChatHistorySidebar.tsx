import { useState } from "react";
import { Plus, MessageSquare, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/hooks/useChatHistory";

interface Props {
  chats: ChatSession[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function ChatHistorySidebar({ chats, activeChatId, onSelect, onNew, onRename, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEdit = (chat: ChatSession) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const confirmEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <Button onClick={onNew} variant="outline" size="sm" className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
              activeChatId === chat.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            onClick={() => editingId !== chat.id && onSelect(chat.id)}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />

            {editingId === chat.id ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                  className="flex-1 bg-transparent border-b border-primary outline-none text-foreground text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <button onClick={(e) => { e.stopPropagation(); confirmEdit(); }} className="text-primary hover:text-primary/80">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 truncate">{chat.title}</span>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(chat); }} className="p-1 rounded hover:bg-muted">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }} className="p-1 rounded hover:bg-destructive/20 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {chats.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No chats yet. Start a new one!</p>
        )}
      </div>
    </div>
  );
}
