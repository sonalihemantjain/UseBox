import { motion } from "framer-motion";
import { BookOpen, MessageSquare, Trophy, Sparkles } from "lucide-react";
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
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Welcome back 👋
          </h1>
          <p className="text-muted-foreground text-lg mb-12">
            Continue your learning journey
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: MessageSquare,
              title: "Start AI Coaching",
              description: "Ask your AI coach anything about your domain",
              color: "text-learn",
              bg: "bg-learn/5",
              border: "border-learn/20",
              href: "/chat",
            },
            {
              icon: BookOpen,
              title: "Explore Knowledge",
              description: "Browse topics, tutorials, and curated content",
              color: "text-share",
              bg: "bg-share/5",
              border: "border-share/20",
              href: "",
            },
            {
              icon: Trophy,
              title: "View Rewards",
              description: "Check your tokens and earning opportunities",
              color: "text-earn",
              bg: "bg-earn/5",
              border: "border-earn/20",
              href: "",
            },
          ].map((action, i) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
              className={`group cursor-pointer rounded-2xl bg-card border ${action.border} p-6 hover:border-opacity-50 transition-all duration-300`}
              onClick={() => action.href && navigate(action.href)}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${action.bg} mb-4`}>
                <action.icon className={`h-6 w-6 ${action.color}`} />
              </div>
              <h3 className="font-display text-lg font-semibold mb-1">{action.title}</h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Continue Learning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-2xl bg-card border border-border p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">Recommended for You</h2>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Your personalized content will appear here</p>
            <p className="text-sm">Start a coaching session to get AI-powered recommendations</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
