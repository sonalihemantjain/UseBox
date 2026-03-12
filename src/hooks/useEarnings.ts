import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface EarningsData {
  totalViews: number;
  totalCredits: number;
  redeemedCredits: number;
  availableCredits: number;
  articleStats: { id: string; title: string; views: number; credits: number }[];
  redemptions: { id: string; amount: number; status: string; created_at: string }[];
  loading: boolean;
}

const CREDITS_PER_VIEW = 1;

export function useEarnings() {
  const { user } = useAuth();
  const [data, setData] = useState<EarningsData>({
    totalViews: 0,
    totalCredits: 0,
    redeemedCredits: 0,
    availableCredits: 0,
    articleStats: [],
    redemptions: [],
    loading: true,
  });

  const fetchEarnings = useCallback(async () => {
    if (!user) return;

    const [{ data: articles }, { data: views }, { data: credits }, { data: redemptions }] = await Promise.all([
      supabase.from("knowledge_articles").select("id, title").eq("user_id", user.id).eq("source_type", "uploaded"),
      supabase.from("article_views").select("article_id"),
      supabase.from("user_credits").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("credit_redemptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    const viewCounts = new Map<string, number>();
    (views ?? []).forEach((v: any) => {
      viewCounts.set(v.article_id, (viewCounts.get(v.article_id) || 0) + 1);
    });

    const articleStats = (articles ?? []).map((a: any) => {
      const viewCount = viewCounts.get(a.id) || 0;
      return { id: a.id, title: a.title, views: viewCount, credits: viewCount * CREDITS_PER_VIEW };
    });

    const totalViews = articleStats.reduce((sum, a) => sum + a.views, 0);
    const totalCredits = totalViews * CREDITS_PER_VIEW;
    const redeemedCredits = (credits as any)?.redeemed_credits || 0;

    // Upsert credits
    if (credits) {
      await supabase.from("user_credits").update({
        total_credits: totalCredits,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    } else {
      await supabase.from("user_credits").insert({
        user_id: user.id,
        total_credits: totalCredits,
        redeemed_credits: 0,
      } as any);
    }

    setData({
      totalViews,
      totalCredits,
      redeemedCredits,
      availableCredits: totalCredits - redeemedCredits,
      articleStats,
      redemptions: (redemptions ?? []) as any[],
      loading: false,
    });
  }, [user]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const redeemCredits = useCallback(async (amount: number) => {
    if (!user) return;
    if (amount <= 0 || amount > data.availableCredits) {
      toast.error("Invalid redemption amount");
      return;
    }

    const { error } = await supabase.from("credit_redemptions").insert({
      user_id: user.id,
      amount,
      status: "pending",
    } as any);

    if (error) {
      toast.error("Redemption failed");
      return;
    }

    await supabase.from("user_credits").update({
      redeemed_credits: data.redeemedCredits + amount,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    toast.success(`Redeemed ${amount} credits! Transfer will be processed soon.`);
    await fetchEarnings();
  }, [user, data.availableCredits, data.redeemedCredits, fetchEarnings]);

  return { ...data, redeemCredits, refetch: fetchEarnings };
}
