import { motion } from "framer-motion";
import { BookOpen, Users, Coins, MessageSquare, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="h-full">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Welcome back 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Learn. Share. Earn. — Your knowledge journey continues here.
          </p>
        </motion.div>

        {/* Three Pillars */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: BookOpen,
              title: "Learn",
              description: "AI-powered coaching adapts to your level. Ask anything, get step-by-step guidance, and master new skills faster.",
              color: "text-learn",
              bg: "bg-learn/5",
              border: "border-learn/20",
              href: "/chat",
              cta: "Start Learning",
            },
            {
              icon: Users,
              title: "Share",
              description: "Contribute your expertise to the community. Curate content, validate answers, and help others grow.",
              color: "text-share",
              bg: "bg-share/5",
              border: "border-share/20",
              href: "/knowledge",
              cta: "Explore Knowledge",
            },
            {
              icon: Coins,
              title: "Earn",
              description: "Get rewarded for quality contributions. Earn tokens, unlock premium features, and monetize your expertise.",
              color: "text-earn",
              bg: "bg-earn/5",
              border: "border-earn/20",
              href: "",
              cta: "View Rewards",
            },
          ].map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.12, duration: 0.5 }}
              className={`group cursor-pointer rounded-2xl bg-card border ${pillar.border} p-8 hover:border-opacity-50 transition-all duration-300 relative overflow-hidden`}
              onClick={() => pillar.href && navigate(pillar.href)}
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${pillar.bg} mb-5`}>
                <pillar.icon className={`h-7 w-7 ${pillar.color}`} />
              </div>
              <h3 className={`font-display text-2xl font-bold ${pillar.color} mb-3`}>{pillar.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{pillar.description}</p>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${pillar.color} group-hover:gap-2.5 transition-all`}>
                {pillar.cta} <ArrowRight className="h-4 w-4" />
              </span>

              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(300px circle at 50% 0%, hsl(var(--${pillar.title.toLowerCase()}) / 0.06), transparent 70%)`,
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="group cursor-pointer rounded-2xl bg-card border border-border p-6 hover:border-primary/30 transition-all duration-300"
            onClick={() => navigate("/chat")}
          >
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Start AI Coaching</h3>
                <p className="text-sm text-muted-foreground">Compare answers from two AI models side-by-side</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="group cursor-pointer rounded-2xl bg-card border border-border p-6 hover:border-primary/30 transition-all duration-300"
            onClick={() => navigate("/learning")}
          >
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Learning Paths</h3>
                <p className="text-sm text-muted-foreground">Follow structured paths to level up your skills</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="rounded-2xl bg-card border border-border p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">How UseBox Works</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { step: "01", title: "Learn from AI", desc: "Ask questions, get personalized coaching, and build real skills." },
              { step: "02", title: "Share Knowledge", desc: "Contribute articles, validate answers, and grow the community." },
              { step: "03", title: "Earn Rewards", desc: "Collect tokens for contributions and unlock premium features." },
            ].map((s) => (
              <div key={s.step} className="space-y-2">
                <span className="inline-block text-xs font-bold text-primary font-display">{s.step}</span>
                <h4 className="font-display font-semibold">{s.title}</h4>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
