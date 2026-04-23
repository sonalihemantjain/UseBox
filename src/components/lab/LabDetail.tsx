import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, CheckSquare, Square, ChevronRight, ChevronDown,
  FlaskConical, Lightbulb, ListChecks, BookOpen, ExternalLink,
  Copy, Check, Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Lab, LabTask, LabTaskStep } from "@/hooks/useLabs";


// ── Code block with Copy + Download buttons ──────────────────────────────────
function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleDownload = () => {
    const ext =
      language === "csv"  ? "csv"  :
      language === "json" ? "json" :
      language === "sql"  ? "sql"  :
      language === "python" || language === "py" ? "py" :
      language === "javascript" || language === "js" ? "js" :
      language === "bash" || language === "sh" ? "sh" :
      "txt";

    const mime =
      language === "csv"  ? "text/csv" :
      language === "json" ? "application/json" :
      "text/plain";

    const filename = `lab-data-${Date.now()}.${ext}`;
    const blob = new Blob([code], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Show download button only for data formats (csv, json) — not for shell/code
  const showDownload = language === "csv" || language === "json";

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          {language || "code"}
        </span>
        <div className="flex items-center gap-1">
          {showDownload && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              title={`Download as .${language}`}
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            {copied
              ? <><Check className="h-3 w-3 text-emerald-400" /> Copied</>
              : <><Copy  className="h-3 w-3" /> Copy</>}
          </button>
        </div>
      </div>
      {/* Code */}
      <pre className="p-4 overflow-x-auto text-sm text-slate-100 font-mono leading-6">
        <code>{code}</code>
      </pre>
    </div>
  );
}


// Custom ReactMarkdown components — wraps <pre><code>…</code></pre> in our CodeBlock
const markdownComponents = {
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    const code = String(children).replace(/\n$/, "");

    if (inline) {
      return (
        <code
          className="bg-slate-900 text-slate-100 px-1.5 py-0.5 rounded text-[0.85em] font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return <CodeBlock language={language} code={code} />;
  },
  // Drop the default <pre> wrapper — our CodeBlock is already a <pre>
  pre: ({ children }: any) => <>{children}</>,
};


// ── Split step.content into Concept / Why / Steps sections ───────────────────
function parseStepContent(content: string) {
  const whyMatch   = content.match(/\*\*Why it matters:\*\*\s*([\s\S]*?)(?=\*\*Steps:\*\*|$)/);
  const stepsMatch = content.match(/\*\*Steps:\*\*([\s\S]*?)$/);

  const conceptEnd = whyMatch
    ? content.indexOf("**Why it matters:**")
    : stepsMatch
    ? content.indexOf("**Steps:**")
    : content.length;

  const concept = content.slice(0, conceptEnd).trim();
  const why     = whyMatch   ? whyMatch[1].trim()   : "";
  const steps   = stepsMatch ? stepsMatch[1].trim() : "";

  return { concept, why, steps };
}


interface Props {
  lab: Lab;
  onBack: () => void;
  onToggleStep: (labId: string, stepId: string) => void;
}

const difficultyColors: Record<string, string> = {
  beginner:     "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  advanced:     "bg-rose-500/10 text-rose-600 border-rose-500/20",
};


export function LabDetail({ lab, onBack, onToggleStep }: Props) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(
    new Set(lab.tasks.map(t => t.id))
  );
  const [readingStep, setReadingStep] = useState<LabTaskStep | null>(null);

  const progressPct =
    lab.total_steps > 0
      ? Math.round((lab.completed_steps / lab.total_steps) * 100)
      : 0;

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  const isOverviewStep = (step: LabTaskStep) =>
    /TASK[_\s]OVERVIEW/i.test(step.title);

  const visibleSteps = (task: LabTask) =>
    task.steps.filter(s => !isOverviewStep(s));

  const getTaskProgress = (task: LabTask) => {
    const steps     = visibleSteps(task);
    const completed = steps.filter(s => s.is_completed).length;
    return { completed, total: steps.length };
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-6 gap-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to labs
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ═════════════ LEFT PANEL ═════════════ */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  📊 Progress
                </h3>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {lab.completed_steps}/{lab.total_steps} steps complete
                  </span>
                  <span className="font-semibold text-primary">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2.5" />
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  📋 Tasks
                </h3>

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
                    const allDone    = total > 0 && completed === total;
                    return (
                      <div key={task.id} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="w-full flex items-center gap-2 p-3 hover:bg-accent/50 transition-colors text-left"
                        >
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                          <div className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                            allDone
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/10 text-primary"
                          }`}>
                            {allDone ? "✓" : ti + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium line-clamp-1">{task.title}</span>
                            {total > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">({completed}/{total})</span>
                            )}
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
                                  onClick={e => { e.stopPropagation(); onToggleStep(lab.id, step.id); }}
                                  className="shrink-0"
                                >
                                  {step.is_completed
                                    ? <CheckSquare className="h-4 w-4 text-emerald-500" />
                                    : <Square className="h-4 w-4 text-muted-foreground/40 hover:text-primary/60 transition-colors" />
                                  }
                                </button>
                                <span className={`text-xs ${
                                  step.is_completed
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground"
                                }`}>
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
                Created:{" "}
                {new Date(lab.created_at).toLocaleDateString("en-US", {
                  year: "numeric", month: "short", day: "2-digit",
                })}
              </p>
            </div>

            {/* ═════════════ RIGHT PANEL ═════════════ */}
            <div className="lg:col-span-2">

              {readingStep ? (
                /* ─── STEP DETAIL VIEW ─── */
                <motion.div
                  key={readingStep.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl bg-card border border-border overflow-hidden"
                >
                  <div className="px-8 pt-7 pb-5 border-b border-border/60 bg-muted/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReadingStep(null)}
                      className="mb-3 gap-2 text-muted-foreground -ml-2"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to overview
                    </Button>
                    <h2 className="font-display text-xl font-bold">{readingStep.title}</h2>
                  </div>

                  <div className="px-8 py-6 space-y-6">
                    {(() => {
                      const { concept, why, steps } = parseStepContent(readingStep.content);
                      return (
                        <>
                          {concept && (
                            <div>
                              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                                Concept
                              </div>
                              <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed [&_p]:text-foreground/90 [&_p]:leading-7 [&_p]:mb-3">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{concept}</ReactMarkdown>
                              </div>
                            </div>
                          )}

                          {why && (
                            <div className="flex gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-1">
                                  Why it matters
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:text-foreground/80 [&_p]:leading-6 [&_p]:mb-0">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{why}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          )}

                          {steps && (
                            <div>
                              <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                                <ListChecks className="h-3.5 w-3.5" /> Steps to perform
                              </div>
                              <div className="rounded-xl border border-border bg-muted/30 px-4 py-4">
                                <div className="prose prose-sm dark:prose-invert max-w-none
                                  [&_ul]:space-y-3
                                  [&_li]:text-foreground/85
                                  [&_li]:leading-6
                                  [&_li]:marker:text-primary
                                  [&_li]:pl-1">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{steps}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          )}

                          {!concept && !why && !steps && (
                            <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:leading-7 [&_p]:mb-3 [&_li]:leading-6">
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{readingStep.content}</ReactMarkdown>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  <div className="px-8 py-5 border-t border-border/60 bg-muted/10 flex items-center gap-3 flex-wrap">
                    <Button
                      variant={readingStep.is_completed ? "outline" : "default"}
                      onClick={() => onToggleStep(lab.id, readingStep.id)}
                      className="gap-2"
                    >
                      {readingStep.is_completed
                        ? <CheckSquare className="h-4 w-4" />
                        : <Square className="h-4 w-4" />}
                      {readingStep.is_completed ? "Mark Incomplete" : "Mark Complete"}
                    </Button>

                    {(readingStep as any).docs_url && (
                      <a
                        href={(readingStep as any).docs_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                          bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400
                          border border-blue-200 dark:border-blue-800
                          hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open in Microsoft Learn
                      </a>
                    )}
                  </div>
                </motion.div>

              ) : (
                /* ─── LAB OVERVIEW ─── */
                <div className="rounded-2xl bg-card border border-border overflow-hidden">
                  <div className="px-8 pt-8 pb-6 border-b border-border/60 bg-muted/20">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <FlaskConical className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-display text-2xl font-bold">{lab.title}</h2>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <Badge variant="outline" className={difficultyColors[lab.difficulty] || ""}>
                            {lab.difficulty}
                          </Badge>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
                            <FlaskConical className="h-3 w-3" /> Hands-on Lab
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-7">
                    <div className="prose prose-sm dark:prose-invert max-w-none
                      [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-foreground [&_h2]:first:mt-0
                      [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-foreground/90
                      [&_p]:leading-7 [&_p]:mb-3
                      [&_ul]:my-3 [&_ul]:space-y-1.5
                      [&_li]:leading-6 [&_li]:marker:text-primary
                      [&_strong]:text-foreground [&_strong]:font-semibold

                      [&_table]:text-sm [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse
                      [&_th]:bg-muted/60 [&_th]:text-left [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:border [&_th]:border-border [&_th]:text-foreground
                      [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-border [&_td]:align-top [&_td]:text-foreground/85

                      [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {lab.description}
                      </ReactMarkdown>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border/60">
                      <p className="text-sm text-muted-foreground">
                        👉 Select a step from the left panel to see exact instructions for performing it with the input data above.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}