import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, BookOpen, CheckCircle2, Bookmark, Flame, TrendingUp,
  BarChart3, PieChart as PieChartIcon, Activity, Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts";

const PIE_COLORS = [
  "hsl(220 14% 75%)",   // unread - muted
  "hsl(199 89% 48%)",   // reading - accent (learn blue)
  "hsl(152 60% 42%)",   // completed - green (earn)
];

const CAT_COLORS = [
  "hsl(245 58% 51%)",
  "hsl(199 89% 48%)",
  "hsl(280 67% 54%)",
  "hsl(152 60% 42%)",
  "hsl(340 65% 55%)",
  "hsl(30 80% 55%)",
  "hsl(160 50% 50%)",
];

const anim = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.06, duration: 0.35 },
});

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-popover border border-border px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const Analytics = () => {
  const { data, loading } = useAnalytics();

  if (loading || !data) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-72 mb-8" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Chats", value: data.totalChats, icon: MessageSquare, color: "text-primary" },
    { label: "Messages Sent", value: data.totalMessages, icon: TrendingUp, color: "text-accent" },
    { label: "Articles Completed", value: data.articlesCompleted, icon: CheckCircle2, color: "text-green-600" },
    { label: "Day Streak", value: data.streakDays, icon: Flame, color: "text-orange-500" },
  ];

  const activityTypeIcons: Record<string, React.ReactNode> = {
    chat: <MessageSquare className="h-3.5 w-3.5 text-primary" />,
    completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
    bookmark: <Bookmark className="h-3.5 w-3.5 text-accent" />,
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        {/* Header */}
        <motion.div {...anim(0)} className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground text-lg">Track your learning progress and engagement</p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} {...anim(i + 1)}>
              <Card className="p-5 bg-card border-border hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="font-display text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          {/* Chat activity chart */}
          <motion.div {...anim(5)}>
            <Card className="p-5 bg-card border-border">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-foreground">Chat Activity (Last 7 Days)</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.chatActivity}>
                  <defs>
                    <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(42 92% 56%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(42 92% 56%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(172 66% 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(172 66% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 16%)" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(220 10% 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220 10% 50%)", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="messages" name="Messages" stroke="hsl(172 66% 50%)" fill="url(#msgGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="chats" name="Chats" stroke="hsl(42 92% 56%)" fill="url(#chatGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Reading progress pie chart */}
          <motion.div {...anim(6)}>
            <Card className="p-5 bg-card border-border">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="h-4 w-4 text-accent" />
                <h3 className="font-display font-semibold text-foreground">Reading Progress</h3>
              </div>
              <div className="flex items-center justify-center gap-8">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={data.progressBreakdown}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {data.progressBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {data.progressBreakdown.map((p, i) => (
                    <div key={p.status} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-sm text-muted-foreground capitalize">{p.status}</span>
                      <span className="text-sm font-medium text-foreground ml-auto">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Knowledge by category */}
          <motion.div {...anim(7)}>
            <Card className="p-5 bg-card border-border">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-foreground">Articles by Category</h3>
              </div>
              {data.knowledgeByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No articles yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.knowledgeByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 16%)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "hsl(220 10% 50%)", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="category" tick={{ fill: "hsl(220 10% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Articles" radius={[0, 6, 6, 0]} barSize={20}>
                      {data.knowledgeByCategory.map((_, i) => (
                        <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>

          {/* Recent activity feed */}
          <motion.div {...anim(8)}>
            <Card className="p-5 bg-card border-border">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-accent" />
                <h3 className="font-display font-semibold text-foreground">Recent Activity</h3>
              </div>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activity yet — start chatting or reading!</p>
              ) : (
                <div className="space-y-3">
                  {data.recentActivity.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        {activityTypeIcons[a.type] || <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
