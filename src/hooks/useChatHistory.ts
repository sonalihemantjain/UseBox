import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage } from "@/lib/chat-stream";

const API_URL = import.meta.env.VITE_API_URL;

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
    if (!user?.id) return;
    try {
      const resp = await fetch(`${API_URL}/api/chats/user/${user.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setChats(data as ChatSession[]);
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const createChat = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null;
    try {
      const resp = await fetch(`${API_URL}/api/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, title: "New Chat" })
      });
      if (resp.ok) {
        const data = await resp.json();
        await fetchChats();
        return (data as { id: string }).id;
      }
    } catch (err) {
      console.error("Error creating chat:", err);
    }
    return null;
  }, [user?.id, fetchChats]);

  const renameChat = useCallback(async (chatId: string, title: string) => {
    try {
      await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      await fetchChats();
    } catch (err) {
      console.error("Error renaming chat:", err);
    }
  }, [fetchChats]);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: "DELETE"
      });
      await fetchChats();
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  }, [fetchChats]);

  const toggleSaveChat = useCallback(async (chatId: string, saved: boolean) => {
    try {
      await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved })
      });
      await fetchChats();
    } catch (err) {
      console.error("Error toggling saved chat:", err);
    }
  }, [fetchChats]);

  const loadMessages = useCallback(async (chatId: string): Promise<ChatMessage[]> => {
    try {
      const resp = await fetch(`${API_URL}/api/chats/${chatId}/messages`);
      if (resp.ok) {
        const data = await resp.json();
        return (data as ChatMessage[]) ?? [];
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
    return [];
  }, []);

  const saveMessage = useCallback(async (chatId: string, msg: ChatMessage) => {
    try {
      await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: msg.role, content: msg.content })
      });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  }, []);

  const autoTitle = useCallback(async (chatId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "…" : "");
    await renameChat(chatId, title);
  }, [renameChat]);

  return { chats, loading, createChat, renameChat, deleteChat, toggleSaveChat, loadMessages, saveMessage, autoTitle, fetchChats };
}
