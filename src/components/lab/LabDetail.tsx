import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckSquare, Square, ChevronRight, ChevronDown, FlaskConical, Lightbulb, ListChecks, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Lab, LabTask, LabTaskStep } from "@/hooks/useLabs";

// Split step content into labelled sections for clear visual rendering
function parseStepContent(content: string) {
  const whyMatch = content.match(/\*\*Why it matters:\*\*\s*([\s\S]*?)(?=\*\*Steps:\*\*|$)/);
  const stepsMatch = content.match(/\*\*Steps:\*\*([\s\S]*?)$/);

  const conceptEnd = whyMatch
    ? content.indexOf("**Why it matters:**")
    : stepsMatch
    ? content.indexOf("**Steps:**")
    : content.length;

  const concept = content.slice(0, conceptEnd).trim();
  const why = whyMatch ? whyMatch[1].trim() : "";
  const steps = stepsMatch ? stepsMatch[1].trim() : "";

  return { concept, why, steps };
}

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

  const isOverviewStep = (step: LabTaskStep) =>
    /TASK[_\s]OVERVIEW/i.test(step.title);

  const visibleSteps = (task: LabTask) => task.steps.filter(s => !isOverviewStep(s));

  const getTaskProgress = (task: LabTask) => {
    const steps = visibleSteps(task);
    const completed = steps.filter(s => s.is_completed).length;
    return { completed, total: steps.length };
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
                {/* Overview shortcut */}
                <button
                  onClick={() => setReadingStep(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-3 transition-colors ${
                    !readingStep
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  Lab Overview
                </button>
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
                            {visibleSteps(task).map(step => (
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
                  className="rounded-2xl bg-card border border-border overflow-hidden"
                >
                  {/* Step header */}
                  <div className="px-8 pt-7 pb-5 border-b border-border/60 bg-muted/20">
                    <Button variant="ghost" size="sm" onClick={() => setReadingStep(null)} className="mb-3 gap-2 text-muted-foreground -ml-2">
                      <ArrowLeft className="h-4 w-4" /> Back to tasks
                    </Button>
                    <h2 className="font-display text-xl font-bold">{readingStep.title}</h2>
                  </div>

                  <div className="px-8 py-6 space-y-6">
                    {(() => {
                      const { concept, why, steps } = parseStepContent(readingStep.content);
                      return (
                        <>
                          {/* Concept section */}
                          {concept && (
                            <div>
                              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                                Concept
                              </div>
                              <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed [&_p]:text-foreground/90 [&_p]:leading-7 [&_p]:mb-3">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{concept}</ReactMarkdown>
                              </div>
                            </div>
                          )}

                          {/* Why it matters section */}
                          {why && (
                            <div className="flex gap-3 rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3">
                              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-1">
                                  Why it matters
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:text-foreground/80 [&_p]:leading-6 [&_p]:mb-0">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{why}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Steps section */}
                          {steps && (
                            <div>
                              <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                <ListChecks className="h-3.5 w-3.5" /> Steps to follow
                              </div>
                              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                                <div className="prose prose-sm dark:prose-invert max-w-none [&_ul]:space-y-2 [&_li]:text-foreground/85 [&_li]:leading-6 [&_li]:marker:text-primary">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{steps}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Fallback: render full content if parsing found nothing */}
                          {!concept && !why && !steps && (
                            <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:leading-7 [&_p]:mb-3 [&_li]:leading-6">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{readingStep.content}</ReactMarkdown>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div className="px-8 py-5 border-t border-border/60 bg-muted/10">
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
                      <div className="prose prose-sm dark:prose-invert max-w-none mt-3 [&_p]:leading-7 [&_p]:mb-3 [&_li]:leading-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{lab.description}</ReactMarkdown>
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
                  <p className="text-muted-foreground text-sm">
                    Select a step from the left panel to start reading and learning.
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
