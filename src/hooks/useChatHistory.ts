import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage } from "@/lib/chat-stream";

export interface ChatSession {
  id: string;
  title: string;
  saved: boolean;
  created_at: string;
  updated_at: string;
}

export function useChatHistory() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chats")
      .select("id, title, saved, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setChats((data as ChatSession[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const createChat = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("chats")
      .insert({ user_id: user.id, title: "New Chat" })
      .select("id")
      .single();
    if (error || !data) return null;
    await fetchChats();
    return (data as { id: string }).id;
  }, [user, fetchChats]);

  const renameChat = useCallback(async (chatId: string, title: string) => {
    await supabase.from("chats").update({ title, updated_at: new Date().toISOString() }).eq("id", chatId);
    await fetchChats();
  }, [fetchChats]);

  const deleteChat = useCallback(async (chatId: string) => {
    await supabase.from("chats").delete().eq("id", chatId);
    await fetchChats();
  }, [fetchChats]);

  const toggleSaveChat = useCallback(async (chatId: string, saved: boolean) => {
    await supabase.from("chats").update({ saved, updated_at: new Date().toISOString() }).eq("id", chatId);
    await fetchChats();
  }, [fetchChats]);

  const loadMessages = useCallback(async (chatId: string): Promise<ChatMessage[]> => {
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    return (data as ChatMessage[]) ?? [];
  }, []);

  const saveMessage = useCallback(async (chatId: string, msg: ChatMessage) => {
    await supabase.from("chat_messages").insert({
      chat_id: chatId,
      role: msg.role,
      content: msg.content,
    });
  }, []);

  const autoTitle = useCallback(async (chatId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "…" : "");
    await renameChat(chatId, title);
  }, [renameChat]);

  return { chats, loading, createChat, renameChat, deleteChat, toggleSaveChat, loadMessages, saveMessage, autoTitle, fetchChats };
}
