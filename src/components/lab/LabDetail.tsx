import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckSquare, Square, ChevronRight, ChevronDown, FlaskConical } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Lab, LabTask, LabTaskStep } from "@/hooks/useLabs";

interface Props {
  lab: Lab;
  onBack: () => void;
  onToggleStep: (labId: string, stepId: string) => void;
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export function LabDetail({ lab, onBack, onToggleStep }: Props) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set(lab.tasks.map(t => t.id)));
  const [readingStep, setReadingStep] = useState<LabTaskStep | null>(null);
  const progressPct = lab.total_steps > 0 ? Math.round((lab.completed_steps / lab.total_steps) * 100) : 0;

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const getTaskProgress = (task: LabTask) => {
    const completed = task.steps.filter(s => s.is_completed).length;
    return { completed, total: task.steps.length };
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-6 gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to labs
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left panel - progress & tasks */}
            <div className="space-y-4">
              {/* Progress card */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  📊 Progress
                </h3>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{lab.completed_steps}/{lab.total_steps} steps complete</span>
                  <span className="font-semibold text-primary">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2.5" />
              </div>

              {/* Tasks card */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  📋 Tasks
                </h3>
                <div className="space-y-2">
                  {lab.tasks.map((task, ti) => {
                    const { completed, total } = getTaskProgress(task);
                    const isExpanded = expandedTasks.has(task.id);
                    const allDone = completed === total;
                    return (
                      <div key={task.id} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="w-full flex items-center gap-2 p-3 hover:bg-accent/50 transition-colors text-left"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          <div className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${allDone ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                            {allDone ? "✓" : ti + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium line-clamp-1">{task.title}</span>
                            <span className="text-xs text-muted-foreground ml-1">({completed}/{total})</span>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border px-3 py-2 space-y-1 bg-muted/30">
                            {task.steps.map(step => (
                              <div
                                key={step.id}
                                className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-accent/50 cursor-pointer transition-colors"
                                onClick={() => setReadingStep(step)}
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); onToggleStep(lab.id, step.id); }}
                                  className="shrink-0"
                                >
                                  {step.is_completed ? (
                                    <CheckSquare className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <Square className="h-4 w-4 text-muted-foreground/40 hover:text-primary/60 transition-colors" />
                                  )}
                                </button>
                                <span className={`text-xs ${step.is_completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                  {step.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Created: {new Date(lab.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })}
              </p>
            </div>

            {/* Content area - right side */}
            <div className="lg:col-span-2">
              {readingStep ? (
                <motion.div
                  key={readingStep.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl bg-card border border-border p-8"
                >
                  <Button variant="ghost" size="sm" onClick={() => setReadingStep(null)} className="mb-4 gap-2 text-muted-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to tasks
                  </Button>
                  <h2 className="font-display text-2xl font-bold mb-6">{readingStep.title}</h2>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{readingStep.content}</ReactMarkdown>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border flex gap-3">
                    <Button
                      variant={readingStep.is_completed ? "outline" : "default"}
                      onClick={() => onToggleStep(lab.id, readingStep.id)}
                      className="gap-2"
                    >
                      {readingStep.is_completed ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      {readingStep.is_completed ? "Mark Incomplete" : "Mark Complete"}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="rounded-2xl bg-card border border-border p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <FlaskConical className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold">{lab.title}</h2>
                      <div className="prose prose-sm dark:prose-invert max-w-none mt-2">
                        <ReactMarkdown>{lab.description}</ReactMarkdown>
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <Badge variant="outline" className={difficultyColors[lab.difficulty] || ""}>
                          {lab.difficulty}
                        </Badge>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
                          <FlaskConical className="h-3 w-3" /> Hands-on Lab
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Select a task from the left panel to begin working through the lab steps.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
