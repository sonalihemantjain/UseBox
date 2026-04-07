import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Circle, Clock, Sparkles, BookOpen, FlaskConical } from "lucide-react";
import { getKnowledgeIcon } from "@/lib/knowledge-icons";
import { StepReaderSheet } from "./StepReaderSheet";
import { CreateLabDialog } from "@/components/lab/CreateLabDialog";
import { useLabs } from "@/hooks/useLabs";
import type { LearningPath, LearningPathStep } from "@/hooks/useLearningPaths";

interface Props {
  path: LearningPath;
  onBack: () => void;
  onEnroll: (pathId: string) => void;
  onToggleStep: (pathId: string, stepId: string) => void;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export function LearningPathDetail({ path, onBack, onEnroll, onToggleStep }: Props) {
  const Icon = getKnowledgeIcon(path.icon);
  const enrolled = !!path.enrollment;
  const completedSteps = new Set(path.enrollment?.completed_steps || []);
  const progressPct = path.steps.length > 0 ? Math.round((completedSteps.size / path.steps.length) * 100) : 0;
  const [readingStep, setReadingStep] = useState<LearningPathStep | null>(null);
  const { generating, generateLab } = useLabs();

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-6 gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to paths
        </Button>

        <div className="rounded-2xl bg-card border border-border p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display text-2xl font-bold">{path.title}</h2>
                {path.is_ai_generated && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
                    <Sparkles className="h-3 w-3" /> AI Generated
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{path.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="outline" className={difficultyColors[path.difficulty] || ""}>
                  {path.difficulty}
                </Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {path.estimated_hours} hours
                </span>
                <span className="text-sm text-muted-foreground">{path.steps.length} steps</span>
              </div>
            </div>
          </div>

          {enrolled && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2.5" />
            </div>
          )}

          {!enrolled && (
            <Button onClick={() => onEnroll(path.id)} className="mt-4 gap-2">
              Start Learning
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold mb-4">Learning Steps</h3>
          {path.steps.map((step, i) => {
            const done = completedSteps.has(step.id);
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-xl border p-4 transition-all ${
                  done ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                } cursor-pointer hover:border-primary/30 group`}
                onClick={() => setReadingStep(step)}
              >
                <div className="flex items-start gap-3">
                  {enrolled && (
                    <button
                      className="pt-0.5 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStep(path.id, step.id);
                      }}
                    >
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-primary/60 transition-colors" />
                      )}
                    </button>
                  )}
                  {!enrolled && (
                    <div className="pt-0.5 shrink-0">
                      <Circle className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground font-medium">Step {step.step_order}</span>
                    <h4 className={`font-medium ${done ? "text-primary" : ""}`}>{step.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{step.description}</p>
                  </div>
                  <div className="pt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <StepReaderSheet
        step={readingStep}
        open={!!readingStep}
        onClose={() => setReadingStep(null)}
        enrolled={enrolled}
        isCompleted={readingStep ? completedSteps.has(readingStep.id) : false}
        onToggleComplete={() => {
          if (readingStep) onToggleStep(path.id, readingStep.id);
        }}
      />
    </div>
  );
}
