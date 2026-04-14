import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface EarningsData {
  totalViews: number;
  totalCredits: number;
  redeemedCredits: number;
  availableCredits: number;
  articleStats: { id: string; title: string; views: number; likes: number; credits: number }[];
  redemptions: { id: string; amount: number; status: string; created_at: string }[];
  loading: boolean;
}

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
    try {
      const result = await api.getEarnings(user.id);
      setData({
        totalViews: result.totalViews,
        totalCredits: result.totalCredits,
        redeemedCredits: result.redeemedCredits,
        availableCredits: result.availableCredits,
        articleStats: result.articleStats,
        redemptions: result.redemptions,
        loading: false,
      });
    } catch (e) {
      console.error("Failed to fetch earnings:", e);
      toast.error("Failed to load earnings");
      setData((prev) => ({ ...prev, loading: false }));
    }
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

    try {
      await api.redeemCredits({ user_id: user.id, amount });
    } catch {
      toast.error("Redemption failed");
      return;
    }

    toast.success(`Redeemed ${amount} credits! Transfer will be processed soon.`);
    await fetchEarnings();
  }, [user, data.availableCredits, fetchEarnings]);

  return { ...data, redeemCredits, refetch: fetchEarnings };
}
