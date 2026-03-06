import { motion } from "framer-motion";
import { MessageSquare, Brain, Trophy, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Ask your AI Coach",
    description: "Start a conversation with your AI coaching assistant. It understands your role, skill level, and context.",
  },
  {
    icon: Brain,
    step: "02",
    title: "Learn & Practice",
    description: "Get personalized step-by-step guidance with real examples, code snippets, and interactive exercises.",
  },
  {
    icon: Trophy,
    step: "03",
    title: "Share Knowledge",
    description: "Contribute verified answers, curate content, and help validate community knowledge.",
  },
  {
    icon: BarChart3,
    step: "04",
    title: "Earn Rewards",
    description: "Accumulate tokens for quality contributions. Unlock premium features and monetize your expertise.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />

      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            From your first question to earning rewards — in four simple steps.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-learn/30 via-share/30 to-earn/30" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="text-center relative"
            >
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-card border border-border mb-6">
                <s.icon className="h-8 w-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center font-display">
                  {s.step}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
