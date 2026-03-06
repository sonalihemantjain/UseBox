import { motion } from "framer-motion";
import { BookOpen, Users, Coins } from "lucide-react";

const pillars = [
  {
    id: "learn",
    icon: BookOpen,
    title: "Learn",
    gradient: "var(--gradient-learn)",
    color: "text-learn",
    border: "border-learn/20",
    bg: "bg-learn/5",
    description:
      "AI-powered coaching adapts to your role and skill level. Get step-by-step guidance, code examples, and deep-dive explanations tailored just for you.",
    features: ["Role-based AI coaching", "Adaptive difficulty", "Interactive tutorials", "Progress tracking"],
  },
  {
    id: "share",
    icon: Users,
    title: "Share",
    gradient: "var(--gradient-share)",
    color: "text-share",
    border: "border-share/20",
    bg: "bg-share/5",
    description:
      "Contribute your expertise to the knowledge base. Curate content, validate answers, and help others grow while building your reputation.",
    features: ["Community contributions", "Peer validation", "Knowledge curation", "Expert badges"],
  },
  {
    id: "earn",
    icon: Coins,
    title: "Earn",
    gradient: "var(--gradient-earn)",
    color: "text-earn",
    border: "border-earn/20",
    bg: "bg-earn/5",
    description:
      "Get rewarded for your knowledge contributions. Earn tokens, unlock premium features, and monetize your expertise through the platform.",
    features: ["Token rewards", "Premium unlocks", "Expertise marketplace", "Revenue sharing"],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const PillarsSection = () => {
  return (
    <section className="py-32 relative" id="learn">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Three pillars. One platform.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            A virtuous cycle where learning fuels sharing, and sharing generates earning.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {pillars.map((pillar) => (
            <motion.div
              key={pillar.id}
              id={pillar.id === "learn" ? undefined : pillar.id}
              variants={item}
              className={`group relative rounded-2xl bg-card border ${pillar.border} p-8 hover:border-opacity-50 transition-all duration-500`}
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${pillar.bg} mb-6`}
              >
                <pillar.icon className={`h-6 w-6 ${pillar.color}`} />
              </div>

              <h3 className={`font-display text-2xl font-bold ${pillar.color} mb-3`}>
                {pillar.title}
              </h3>

              <p className="text-muted-foreground leading-relaxed mb-6">
                {pillar.description}
              </p>

              <ul className="space-y-2.5">
                {pillar.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${pillar.bg}`}
                      style={{ background: pillar.gradient }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Hover glow */}
              <div
                className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                style={{
                  background: `radial-gradient(400px circle at 50% 0%, hsl(var(--${pillar.id}) / 0.06), transparent 70%)`,
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PillarsSection;
