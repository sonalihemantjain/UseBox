import { motion } from "framer-motion";
import { BookOpen, Search } from "lucide-react";

const Knowledge = () => {
  return (
    <div className="h-full">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Knowledge Browser
          </h1>
          <p className="text-muted-foreground text-lg mb-12">
            Explore topics, tutorials, and curated content
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl bg-card border border-border p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">Search Knowledge Base</h2>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">Knowledge base coming soon</p>
            <p className="text-sm">Content ingestion and semantic search will be available here</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Knowledge;
