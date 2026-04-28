import { motion } from "framer-motion";
import { BookOpen, Users, Coins, MessageSquare, Sparkles, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, ROLE_LABELS } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

const ROLE_DESCRIPTIONS: Record<string, { greeting: string; learnDesc: string; shareDesc: string; earnDesc: string; suggestions: string[] }> = {
  businessuser: {
    greeting: "Continue mastering business strategy and product adoption.",
    learnDesc: "Get AI coaching on product adoption, go-to-market strategies, and business analytics.",
    shareDesc: "Contribute business insights, case studies, and best practices to the community.",
    earnDesc: "Earn rewards for sharing business knowledge and mentoring others.",
    suggestions: ["How do I improve product adoption?", "Best practices for stakeholder presentations", "Understanding SaaS metrics"],
  },
  citizen_developer: {
    greeting: "Keep building powerful apps and flows with low-code tools.",
    learnDesc: "Learn Power Apps, Power Automate, and Power Fx to automate your team's work without writing code.",
    shareDesc: "Share your app templates, flow patterns, and connector tips with the community.",
    earnDesc: "Earn tokens by contributing reusable templates and automation guides.",
    suggestions: ["How to build a canvas app in Power Apps?", "Best Power Automate flow patterns", "When to use Power Apps vs Power Automate?"],
  },
  prodeveloper: {
    greeting: "Level up your development skills and best practices.",
    learnDesc: "Get AI coaching on coding patterns, architecture, debugging, and modern frameworks.",
    shareDesc: "Share code snippets, technical tutorials, and open-source contributions.",
    earnDesc: "Earn rewards for quality code reviews, tutorials, and community answers.",
    suggestions: ["Explain RAG architecture", "Best practices for API design", "How to optimize React performance?"],
  },
  data_analyst: {
    greeting: "Turn data into insights that drive decisions.",
    learnDesc: "Get AI coaching on Power BI, DAX formulas, data modelling, and dashboard best practices.",
    shareDesc: "Share report templates, DAX patterns, and data storytelling techniques.",
    earnDesc: "Earn rewards for contributing reusable data models and BI guides.",
    suggestions: ["How to write a DAX measure for YoY growth?", "Best practices for Power BI data modelling", "When to use calculated columns vs measures?"],
  },
  operations_manager: {
    greeting: "Automate processes and improve your team's efficiency.",
    learnDesc: "Learn to design approval workflows, automate repetitive tasks, and measure process performance.",
    shareDesc: "Share process templates, automation blueprints, and efficiency frameworks.",
    earnDesc: "Earn rewards for contributing workflow templates and process guides.",
    suggestions: ["How to automate an approval process?", "Best practices for workflow design", "How to track KPIs with Power BI?"],
  },
  product_manager: {
    greeting: "Build better products with AI-powered insights.",
    learnDesc: "Get coaching on feature prioritisation, capability comparisons, and product adoption strategies.",
    shareDesc: "Share product frameworks, roadmap templates, and adoption case studies.",
    earnDesc: "Earn rewards for contributing product strategy knowledge to the community.",
    suggestions: ["How to prioritise features with AI tools?", "Comparing Microsoft Copilot vs custom GPT", "Best practices for measuring feature adoption"],
  },
  architect: {
    greeting: "Design scalable systems and lead technical decisions.",
    learnDesc: "AI coaching on system design, scalability patterns, and architecture decisions.",
    shareDesc: "Share architecture blueprints, design patterns, and technical decision frameworks.",
    earnDesc: "Earn premium rewards for expert-level architecture reviews and mentoring.",
    suggestions: ["Microservices vs monolith tradeoffs", "Event-driven architecture patterns", "How to design for scale?"],
  },
  admin: {
    greeting: "Keep your platform secure, compliant, and well-governed.",
    learnDesc: "Learn platform administration, governance policies, security best practices, and compliance controls.",
    shareDesc: "Share admin guides, security policies, DLP patterns, and governance frameworks.",
    earnDesc: "Earn rewards for maintaining platform health and quality standards.",
    suggestions: ["User access management best practices", "How to configure DLP in Power Platform?", "Security audit checklist for Copilot Studio"],
  },
};

const Dashboard = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const roleData = role ? (ROLE_DESCRIPTIONS[role] || ROLE_DESCRIPTIONS.businessuser) : null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Welcome 👋
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
              description: roleData?.learnDesc || "AI-powered coaching adapts to your level. Start chatting to discover your persona.",
              color: "text-learn",
              bg: "bg-learn/5",
              border: "border-learn/20",
              href: "/chat",
              cta: "Start Learning",
            },
            {
              icon: Users,
              title: "Share",
              description: roleData?.shareDesc || "Contribute your expertise to the community once your persona is set.",
              color: "text-share",
              bg: "bg-share/5",
              border: "border-share/20",
              href: "/knowledge",
              cta: "Explore Knowledge",
            },
            {
              icon: Coins,
              title: "Earn",
              description: roleData?.earnDesc || "Earn rewards for quality contributions after your persona is discovered.",
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
              className={`group cursor-pointer rounded-2xl bg-card border ${pillar.border} p-5 sm:p-8 hover:border-opacity-50 transition-all duration-300 relative overflow-hidden`}
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
                <h3 className="font-display text-lg font-semibold">Learn</h3>
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
                <h3 className="font-display text-lg font-semibold">Share</h3>
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
          className="rounded-2xl bg-card border border-border p-5 sm:p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">How Usebox Works</h2>
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
