import { motion } from "framer-motion";
import { BookOpen, Users, Coins, MessageSquare, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, ROLE_LABELS } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

const ROLE_DESCRIPTIONS: Record<string, { greeting: string; learnDesc: string; shareDesc: string; earnDesc: string; suggestions: string[] }> = {
  business: {
    greeting: "Continue mastering business strategy and product adoption.",
    learnDesc: "Get AI coaching on product adoption, go-to-market strategies, and business analytics.",
    shareDesc: "Contribute business insights, case studies, and best practices to the community.",
    earnDesc: "Earn rewards for sharing business knowledge and mentoring others.",
    suggestions: ["How do I improve product adoption?", "Best practices for stakeholder presentations", "Understanding SaaS metrics"],
  },
  lowcode: {
    greeting: "Keep building with low-code tools and automation.",
    learnDesc: "Learn to build faster with low-code platforms, automation tools, and integrations.",
    shareDesc: "Share your low-code templates, workflows, and integration patterns.",
    earnDesc: "Earn tokens by contributing reusable templates and automation guides.",
    suggestions: ["How to build a workflow automation?", "Best low-code integration patterns", "When to go custom vs low-code?"],
  },
  developer: {
    greeting: "Level up your development skills and best practices.",
    learnDesc: "Get AI coaching on coding patterns, architecture, debugging, and modern frameworks.",
    shareDesc: "Share code snippets, technical tutorials, and open-source contributions.",
    earnDesc: "Earn rewards for quality code reviews, tutorials, and community answers.",
    suggestions: ["Explain RAG architecture", "Best practices for API design", "How to optimize React performance?"],
  },
  architect: {
    greeting: "Design scalable systems and lead technical decisions.",
    learnDesc: "AI coaching on system design, scalability patterns, and architecture decisions.",
    shareDesc: "Share architecture blueprints, design patterns, and technical decision frameworks.",
    earnDesc: "Earn premium rewards for expert-level architecture reviews and mentoring.",
    suggestions: ["Microservices vs monolith tradeoffs", "Event-driven architecture patterns", "How to design for scale?"],
  },
  admin: {
    greeting: "Manage your platform, users, and configurations.",
    learnDesc: "Learn platform administration, security best practices, and team management.",
    shareDesc: "Share admin guides, security policies, and governance frameworks.",
    earnDesc: "Earn rewards for maintaining platform health and quality standards.",
    suggestions: ["User access management best practices", "Security audit checklist", "How to set up team roles?"],
  },
};

const Dashboard = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const roleData = role ? (ROLE_DESCRIPTIONS[role] || ROLE_DESCRIPTIONS.business) : null;

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
            Welcome back{role ? `, ${ROLE_LABELS[role]}` : ""} 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            {roleData ? roleData.greeting : "Start a coaching session to discover your persona and unlock personalized content."}
          </p>
        </motion.div>

        {/* Three Pillars */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: BookOpen,
              title: "Learn",
              description: roleData.learnDesc,
              color: "text-learn",
              bg: "bg-learn/5",
              border: "border-learn/20",
              href: "/chat",
              cta: "Start Learning",
            },
            {
              icon: Users,
              title: "Share",
              description: roleData.shareDesc,
              color: "text-share",
              bg: "bg-share/5",
              border: "border-share/20",
              href: "/knowledge",
              cta: "Explore Knowledge",
            },
            {
              icon: Coins,
              title: "Earn",
              description: roleData.earnDesc,
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
