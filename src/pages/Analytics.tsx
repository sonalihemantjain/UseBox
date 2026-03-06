import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

const Analytics = () => {
  return (
    <div className="h-full">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Analytics
          </h1>
          <p className="text-muted-foreground text-lg mb-12">
            Track your learning progress and engagement
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl bg-card border border-border p-8"
        >
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">Analytics dashboard coming soon</p>
            <p className="text-sm">Usage metrics, learning progression, and engagement trends</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
