import { useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, KeyRound, User, Cpu, BookmarkCheck, MessageSquare, ExternalLink, Trash2, Pencil, Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useModelSelection } from "@/hooks/useModelSelection";
import { useChatHistory } from "@/hooks/useChatHistory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedModels, setModel, availableModels } = useModelSelection();
  const { chats, toggleSaveChat, renameChat } = useChatHistory();

  // Password reset
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Saved chats
  const [chatSearch, setChatSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const savedChats = chats.filter((c) => c.saved && c.title.toLowerCase().includes(chatSearch.toLowerCase()));

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setNewPassword("");
    }
  };

  const handleUnsave = async (chatId: string) => {
    await toggleSaveChat(chatId, false);
    toast.success("Removed from saved chats");
  };

  const saveEdit = async () => {
    if (!editingId || !editValue.trim()) return;
    await renameChat(editingId, editValue.trim());
    setEditingId(null);
    toast.success("Chat renamed");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground text-lg">Manage your account, preferences and saved content</p>
        </motion.div>

        <div className="space-y-8">
          {/* Profile Information */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Profile Information</h2>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Email</Label>
                <p className="text-foreground font-medium mt-1">{user?.email ?? "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Account Created</Label>
                <p className="text-foreground font-medium mt-1">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </motion.section>

          <Separator />

          {/* Reset Password */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Reset Password</h2>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="flex-1"
                />
                <Button onClick={handlePasswordReset} disabled={changingPw}>
                  {changingPw ? "Updating…" : "Update Password"}
                </Button>
              </div>
            </div>
          </motion.section>

          <Separator />

          {/* Model Selection */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Model Selection</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select exactly 2 AI models for the comparison view in Learn.
            </p>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="space-y-3">
                {availableModels.map((m) => {
                  const isSelected = selectedModels.includes(m.id);
                  const isDisabled = !isSelected && selectedModels.length >= 2;
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary/30 bg-primary/5"
                          : isDisabled
                          ? "border-border opacity-50 cursor-not-allowed"
                          : "border-border hover:border-primary/20"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            toggleModel(m.id);
                          } else {
                            toggleModel(m.id);
                          }
                        }}
                      />
                      <span className="text-sm font-medium text-foreground">{m.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{m.id.split("/")[0]}</span>
                    </label>
                  );
                })}
              </div>
              {selectedModels.length < 2 && (
                <p className="text-xs text-destructive mt-3">Please select 2 models for comparison.</p>
              )}
            </div>
          </motion.section>

          <Separator />

          {/* Saved Chats */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <BookmarkCheck className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Saved Chats</h2>
            </div>

            <div className="relative max-w-sm mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Search saved chats..."
                className="pl-9"
              />
            </div>

            {savedChats.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-border bg-card">
                <BookmarkCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {chatSearch ? "No matching saved chats" : "No saved chats yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedChats.map((chat) => (
                  <div
                    key={chat.id}
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
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={saveEdit}>
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-sm font-medium text-foreground truncate">{chat.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(chat.updated_at).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingId !== chat.id && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditingId(chat.id); setEditValue(chat.title); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/chat?id=${chat.id}`)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleUnsave(chat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
