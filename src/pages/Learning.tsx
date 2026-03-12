import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Route } from "lucide-react";
import { useLearningPaths, type LearningPath } from "@/hooks/useLearningPaths";
import { LearningPathCard } from "@/components/learning/LearningPathCard";
import { LearningPathDetail } from "@/components/learning/LearningPathDetail";
import { GeneratePathDialog } from "@/components/learning/GeneratePathDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Learning = () => {
  const { paths, loading, generating, enrollInPath, toggleStepComplete, generateAIPath, deleteAIPath } = useLearningPaths();
  const [selected, setSelected] = useState<LearningPath | null>(null);
  const [tab, setTab] = useState<"all" | "enrolled" | "ai">("all");

  const filtered = paths.filter((p) => {
    if (tab === "enrolled") return !!p.enrollment;
    if (tab === "ai") return p.is_ai_generated;
    return true;
  });

  // Sync selected path with latest data
  const currentSelected = selected ? paths.find(p => p.id === selected.id) || null : null;

  if (currentSelected) {
    return (
      <div className="h-full">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
          <LearningPathDetail
            path={currentSelected}
            onBack={() => setSelected(null)}
            onEnroll={enrollInPath}
            onToggleStep={toggleStepComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Learning Paths</h1>
            <p className="text-muted-foreground text-lg">
              Structured journeys to master AI skills
            </p>
          </div>
          <GeneratePathDialog generating={generating} onGenerate={generateAIPath} />
        </motion.div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All Paths</TabsTrigger>
            <TabsTrigger value="enrolled">My Learning</TabsTrigger>
            <TabsTrigger value="ai">AI Generated</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 text-muted-foreground"
          >
            <Route className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">
              {tab === "enrolled" ? "No enrolled paths yet" : tab === "ai" ? "No AI paths generated yet" : "No paths available"}
            </p>
            <p className="text-sm">
              {tab === "ai" ? "Click 'Generate AI Path' to create one" : "Start a learning path to track your progress"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((path, i) => (
              <LearningPathCard
                key={path.id}
                path={path}
                index={i}
                onSelect={setSelected}
                onEnroll={enrollInPath}
                onDelete={path.is_ai_generated ? deleteAIPath : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Learning;
