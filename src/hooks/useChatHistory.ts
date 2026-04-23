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

const CHATS_CHANGED_EVENT = "usebox-chats-changed";

function notifyChatsChanged() {
  window.dispatchEvent(new Event(CHATS_CHANGED_EVENT));
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

  // Re-fetch whenever any hook instance signals a change
  useEffect(() => {
    const handler = () => fetchChats();
    window.addEventListener(CHATS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CHATS_CHANGED_EVENT, handler);
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
        notifyChatsChanged();
        return (data as { id: string }).id;
      }
    } catch (err) {
      console.error("Error creating chat:", err);
    }
    return null;
  }, [user?.id]);

  const renameChat = useCallback(async (chatId: string, title: string) => {
    try {
      await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      notifyChatsChanged();
    } catch (err) {
      console.error("Error renaming chat:", err);
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: "DELETE"
      });
      notifyChatsChanged();
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  }, []);

  const toggleSaveChat = useCallback(async (chatId: string, saved: boolean) => {
    try {
      await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved })
      });
      notifyChatsChanged();
    } catch (err) {
      console.error("Error toggling saved chat:", err);
    }
  }, []);

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

  const removeFromList = useCallback((chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
  }, []);

  return { chats, loading, createChat, renameChat, deleteChat, toggleSaveChat, loadMessages, saveMessage, autoTitle, fetchChats, removeFromList };
}
