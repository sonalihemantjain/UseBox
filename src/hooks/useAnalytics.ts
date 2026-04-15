import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

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
      const analytics = await api.getAnalytics(user.id);
      setData(analytics as AnalyticsData);
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
