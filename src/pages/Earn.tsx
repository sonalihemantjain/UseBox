import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Eye, Heart, TrendingUp, Wallet, ArrowDownToLine, FileText, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEarnings } from "@/hooks/useEarnings";

const statCards = [
  { key: "totalViews", label: "Total Views", icon: Eye, color: "text-blue-500" },
  { key: "totalCredits", label: "Total Credits", icon: Coins, color: "text-amber-500" },
  { key: "availableCredits", label: "Available", icon: TrendingUp, color: "text-green-500" },
  { key: "redeemedCredits", label: "Redeemed", icon: Wallet, color: "text-purple-500" },
] as const;

const statusStyles: Record<string, { className: string; icon: React.ReactNode }> = {
  pending: { className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: <Clock className="h-3 w-3" /> },
  completed: { className: "bg-green-500/10 text-green-600 border-green-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const Earn = () => {
  const { totalViews, totalCredits, availableCredits, redeemedCredits, articleStats, redemptions, loading, redeemCredits } = useEarnings();
  const [redeemAmount, setRedeemAmount] = useState("");
  const [redeemOpen, setRedeemOpen] = useState(false);

  const handleRedeem = async () => {
    const amt = parseFloat(redeemAmount);
    if (isNaN(amt) || amt <= 0) return;
    await redeemCredits(amt);
    setRedeemAmount("");
    setRedeemOpen(false);
  };

  const stats = { totalViews, totalCredits, availableCredits, redeemedCredits } as Record<string, number>;

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Earn</h1>
              <p className="text-muted-foreground text-lg">Track your knowledge sharing earnings</p>
            </div>
            <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={availableCredits <= 0}>
                  <ArrowDownToLine className="h-4 w-4" /> Redeem Credits
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Redeem Credits</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <p className="text-sm text-muted-foreground">
                    Available: <span className="font-semibold text-foreground">{availableCredits}</span> credits
                  </p>
                  <Input
                    type="number"
                    placeholder="Amount to redeem"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    max={availableCredits}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground">Credits will be transferred to your bank account after processing.</p>
                  <Button onClick={handleRedeem} className="w-full" disabled={!redeemAmount || parseFloat(redeemAmount) > availableCredits}>
                    Confirm Redemption
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((s, i) => (
              <motion.div key={s.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                        <s.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats[s.key]}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Article Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
              ) : articleStats.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">No shared content yet. Upload documents in the Share section to start earning.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {articleStats.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{a.title}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground"><Eye className="h-3 w-3" />{a.views}</span>
                        <span className="flex items-center gap-1 text-amber-500 font-medium"><Coins className="h-3 w-3" />{a.credits}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Redemption History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Redemption History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
              ) : redemptions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">No redemptions yet. Earn credits by sharing knowledge.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {redemptions.map((r) => {
                    const style = statusStyles[r.status] || statusStyles.pending;
                    return (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div>
                          <p className="text-sm font-medium">{r.amount} credits</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline" className={`gap-1 ${style.className}`}>
                          {style.icon}
                          {r.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Earn;
