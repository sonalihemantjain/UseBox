import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

const Learning = () => {
  return (
    <div className="h-full">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Learning Paths
          </h1>
          <p className="text-muted-foreground text-lg mb-12">
            Personalized learning journeys for your role
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl bg-card border border-border p-8"
        >
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">Learning paths coming soon</p>
            <p className="text-sm">AI-generated learning journeys based on your role and skill level</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Learning;
