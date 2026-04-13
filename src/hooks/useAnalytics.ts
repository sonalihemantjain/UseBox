import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL;

export interface AnalyticsData {
  totalChats: number;
  totalMessages: number;
  savedChats: number;
  articlesRead: number;
  articlesCompleted: number;
  articlesBookmarked: number;
  totalArticles: number;
  chatActivity: { date: string; chats: number; messages: number }[];
  knowledgeByCategory: { category: string; count: number }[];
  progressBreakdown: { status: string; count: number }[];
  recentActivity: { type: string; title: string; date: string }[];
  streakDays: number;
}

export function useAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [
        chatsResp,
        messagesResp,
        { data: articles },
        { data: bookmarks },
        { data: progress },
      ] = await Promise.all([
        window.fetch(`${API_URL}/api/chats/user/${user.id}`),
        window.fetch(`${API_URL}/api/chats/user/${user.id}/messages`),
        supabase.from("knowledge_articles").select("id, category, created_at"),
        supabase.from("knowledge_bookmarks").select("id, article_id, created_at").eq("user_id", user.id),
        supabase.from("knowledge_progress").select("id, article_id, status, completed_at, created_at, updated_at").eq("user_id", user.id),
      ]);

      const chats = chatsResp.ok ? await chatsResp.json() : [];
      const messages = messagesResp.ok ? await messagesResp.json() : [];

      const chatList = (chats ?? []) as any[];
      const msgList = (messages ?? []) as any[];
      const articleList = (articles ?? []) as any[];
      const bookmarkList = (bookmarks ?? []) as any[];
      const progressList = (progress ?? []) as any[];

      // Chat activity over last 7 days
      const now = new Date();
      const chatActivity: { date: string; chats: number; messages: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
        const dayChats = chatList.filter((c) => c.created_at?.slice(0, 10) === dateStr).length;
        const dayMsgs = msgList.filter((m) => m.created_at?.slice(0, 10) === dateStr).length;
        chatActivity.push({ date: dayLabel, chats: dayChats, messages: dayMsgs });
      }

      // Knowledge by category
      const catMap = new Map<string, number>();
      articleList.forEach((a) => {
        catMap.set(a.category, (catMap.get(a.category) || 0) + 1);
      });
      const knowledgeByCategory = Array.from(catMap.entries()).map(([category, count]) => ({ category, count }));

      // Progress breakdown
      const statusCounts = { unread: 0, reading: 0, completed: 0 };
      progressList.forEach((p) => {
        if (p.status in statusCounts) statusCounts[p.status as keyof typeof statusCounts]++;
      });
      const trackedIds = new Set(progressList.map((p) => p.article_id));
      statusCounts.unread = articleList.filter((a) => !trackedIds.has(a.id)).length;
      const progressBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

      // Recent activity (last 10 items)
      const activities: { type: string; title: string; date: string; ts: number }[] = [];
      chatList.slice(0, 5).forEach((c) =>
        activities.push({ type: "chat", title: c.title || "New Chat", date: c.created_at, ts: new Date(c.created_at).getTime() })
      );
      progressList
        .filter((p) => p.status === "completed")
        .slice(0, 5)
        .forEach((p) => {
          const art = articleList.find((a) => a.id === p.article_id);
          activities.push({ type: "completed", title: art?.category || "Article", date: p.completed_at || p.updated_at, ts: new Date(p.completed_at || p.updated_at).getTime() });
        });
      bookmarkList.slice(0, 5).forEach((b) =>
        activities.push({ type: "bookmark", title: "Bookmarked article", date: b.created_at, ts: new Date(b.created_at).getTime() })
      );
      activities.sort((a, b) => b.ts - a.ts);

      // Streak: consecutive days with any activity
      const activityDates = new Set<string>();
      chatList.forEach((c) => activityDates.add(c.created_at?.slice(0, 10)));
      msgList.forEach((m) => activityDates.add(m.created_at?.slice(0, 10)));
      progressList.forEach((p) => activityDates.add((p.updated_at || p.created_at)?.slice(0, 10)));
      let streakDays = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        if (activityDates.has(d.toISOString().slice(0, 10))) {
          streakDays++;
        } else if (i > 0) break;
      }

      setData({
        totalChats: chatList.length,
        totalMessages: msgList.length,
        savedChats: chatList.filter((c) => c.saved).length,
        articlesRead: progressList.filter((p) => p.status === "reading" || p.status === "completed").length,
        articlesCompleted: progressList.filter((p) => p.status === "completed").length,
        articlesBookmarked: bookmarkList.length,
        totalArticles: articleList.length,
        chatActivity,
        knowledgeByCategory,
        progressBreakdown,
        recentActivity: activities.slice(0, 8),
        streakDays,
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, refetch: fetchAnalytics };
}
