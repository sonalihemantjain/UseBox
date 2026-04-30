import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Loader2, Wand2, BookMarked, ChevronRight,
  Trash2, Pencil, ArrowRight,
} from "lucide-react";
import { useLabs, type Lab, type LabTask, type LabTaskStep } from "@/hooks/useLabs";
import { useUserRole, ROLE_LABELS } from "@/hooks/useUserRole";
import { useUserContextFilters } from "@/hooks/useUserContextFilters";
import { useContextFilterOptions } from "@/hooks/useContextFilterOptions";
import { usePersonaOptions } from "@/hooks/usePersonaOptions";
import { LabDetail } from "@/components/lab/LabDetail";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ContextEditDialog } from "@/components/ContextEditDialog";
import { api } from "@/lib/api";
import type { ApiLab } from "@/lib/api";
import { useCustomOptions } from "@/hooks/useCustomOptions";
import { toast } from "sonner";

// ── Constants ────────────────────────────────────────────────────────────────

const STATE_BADGE = {
  "not-started": { label: "Not started", className: "bg-muted/60 text-muted-foreground border-border/60" },
  "in-progress":  { label: "In progress",  className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  done:           { label: "Done",          className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

const FILTER_LABELS: Record<string, string> = {
  all: "All", "not-started": "Not started", "in-progress": "In progress", done: "Done",
};
const FILTER_OPTIONS = ["all", "not-started", "in-progress", "done"] as const;

const EXAMPLE_TOPICS = [
  "Power Automate flows",
  "RAG pipeline with LangChain",
  "Copilot Studio bot",
  "Azure AI Search",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLabState(completed: number, total: number): "not-started" | "in-progress" | "done" {
  if (total === 0 || completed === 0) return "not-started";
  if (completed >= total) return "done";
  return "in-progress";
}

function getPredefinedProgress(labId: string): string[] {
  return JSON.parse(localStorage.getItem(`usebox_predefined_steps_${labId}`) || "[]") as string[];
}

function predefinedToLab(apiLab: ApiLab, completedStepIds: Set<string> = new Set()): Lab {
  const tasks: LabTask[] = (apiLab.tasks || []).map(t => ({
    id: t.id, lab_id: apiLab.id, task_order: t.task_order,
    title: t.title, description: t.description || "",
    steps: (t.steps || []).map(s => ({
      id: s.id, task_id: t.id, step_order: s.step_order,
      title: s.title, content: s.content,
      is_completed: completedStepIds.has(s.id),
    } as LabTaskStep)),
  }));
  const total_steps = tasks.reduce((sum, t) => sum + t.steps.length, 0);
  const taskSummary = tasks.map((t, i) => {
    const stepTitles = t.steps.map(s => `  - ${s.title}`).join("\n");
    return `**${i + 1}. ${t.title}**\n${t.description ? t.description + "\n" : ""}${stepTitles}`;
  }).join("\n\n");
  const richDescription = [
    apiLab.description || "",
    tasks.length > 0 ? `\n## What You'll Cover\n\n${taskSummary}` : "",
  ].filter(Boolean).join("\n");
  return {
    id: apiLab.id, user_id: "", title: apiLab.title, description: richDescription,
    topic: apiLab.topic || "", difficulty: apiLab.difficulty || "intermediate",
    persona: apiLab.persona || "no-persona", total_steps,
    completed_steps: completedStepIds.size, status: "in_progress",
    created_at: apiLab.created_at, tasks,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

type FilterKey = "all" | "not-started" | "in-progress" | "done";

interface FilterTabsProps {
  active: FilterKey;
  counts: Record<string, number>;
  onChange: (f: FilterKey) => void;
}
function FilterTabs({ active, counts, onChange }: FilterTabsProps) {
  return (
    <div className="flex items-center gap-0.5 border-b border-border/40 mb-5">
      {FILTER_OPTIONS.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`relative flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
            active === f ? "text-foreground font-semibold" : "font-medium text-muted-foreground hover:text-foreground"
          }`}
        >
          {FILTER_LABELS[f]}
          <span className={`rounded-full text-[10px] font-bold px-1.5 py-0.5 leading-none transition-colors ${
            active === f ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            {counts[f] ?? 0}
          </span>
          {active === f && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

interface HeroCardProps {
  title: string;
  description: string;
  completed: number;
  total: number;
  onContinue: () => void;
}
function HeroCard({ title, description, completed, total, onContinue }: HeroCardProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div
      className="rounded-2xl border-2 border-primary/50 bg-primary/[0.04] p-6 cursor-pointer hover:border-primary/70 hover:bg-primary/[0.07] transition-all"
      onClick={onContinue}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/15 text-primary shrink-0">
          <FlaskConical className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg mb-1 truncate">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{description}</p>
          <div className="flex items-center gap-3">
            <Progress value={pct} className="h-1.5 flex-1 max-w-xs" />
            <span className="text-xs text-muted-foreground shrink-0 font-medium">{completed} / {total} steps</span>
          </div>
        </div>
        <Button
          size="sm"
          className="shrink-0 gap-1.5 ml-2"
          onClick={e => { e.stopPropagation(); onContinue(); }}
        >
          Continue <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface LabCardProps {
  title: string;
  description: string;
  totalSteps: number;
  completedSteps: number;
  state: "not-started" | "in-progress" | "done";
  icon: React.ReactNode;
  onOpen: () => void;
  onDelete?: () => void;
  index: number;
}
function LabCard({ title, description, totalSteps, completedSteps, state, icon, onOpen, onDelete, index }: LabCardProps) {
  const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all flex flex-col gap-3"
      onClick={onOpen}
    >
      {onDelete && (
        <button
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
          onClick={e => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      {/* Icon + title row */}
      <div className="flex items-start gap-3 pr-6">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold line-clamp-1">{title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{description}</p>
        </div>
      </div>
      {/* Progress + status */}
      <div className="flex items-center gap-2">
        <Progress value={pct} className="h-1.5 flex-1 bg-border/60" />
        <span className="text-[10px] text-muted-foreground shrink-0">{completedSteps} / {totalSteps} steps</span>
      </div>
      <div>
        <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATE_BADGE[state].className}`}>
          {STATE_BADGE[state].label}
        </span>
      </div>
    </motion.div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "generate" | "my-labs" | "predefined";

// ── Main component ────────────────────────────────────────────────────────────

export default function Lab() {
  const { labs, loading, generating, generateLab, toggleStepComplete, deleteLab } = useLabs();
  const { role } = useUserRole();
  const { functionalArea, industry } = useUserContextFilters();
  const { functionalAreas, industries, loading: filtersLoading } = useContextFilterOptions();
  const { personas, loading: personasLoading } = usePersonaOptions(functionalArea);
  const { getByType } = useCustomOptions();
  const [contextEditOpen, setContextEditOpen] = useState(false);

  const customPersonas = getByType("persona");
  const selectedIndustryLabel = industries.find(i => i.key === industry)?.display_name ?? null;
  const selectedFALabel = functionalAreas.find(f => f.key === functionalArea)?.display_name ?? null;
  const selectedPersonaLabel =
    personas.find(p => p.key === role)?.display_name ??
    customPersonas.find(p => p.key === role)?.display_name ??
    (role ? ROLE_LABELS[role] : null);
  const contextLabel = [selectedIndustryLabel, selectedFALabel, selectedPersonaLabel || "No persona"].filter(Boolean).join(" | ");

  const [selected, setSelected] = useState<Lab | null>(null);
  const [topic, setTopic] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  const [predefinedLabs, setPredefinedLabs] = useState<ApiLab[]>([]);
  const [predefinedLoading, setPredefinedLoading] = useState(false);
  const [selectedPredefined, setSelectedPredefined] = useState<Lab | null>(null);

  const [myLabsFilter, setMyLabsFilter] = useState<FilterKey>("all");
  const [predefinedFilter, setPredefinedFilter] = useState<FilterKey>("all");

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setMyLabsFilter("all");
    setPredefinedFilter("all");
  };

  const loadPredefined = useCallback(async (persona?: string | null) => {
    setPredefinedLoading(true);
    try {
      const items = await api.getPredefinedLabs(persona);
      setPredefinedLabs(items);
    } catch {
      toast.error("Failed to load predefined labs");
    } finally {
      setPredefinedLoading(false);
    }
  }, []);

  useEffect(() => { loadPredefined(role); }, [role, loadPredefined]);

  const handleTogglePredefinedStep = useCallback((_labId: string, stepId: string) => {
    setSelectedPredefined(prev => {
      if (!prev) return prev;
      const updatedTasks = prev.tasks.map(t => ({
        ...t,
        steps: t.steps.map(s => s.id === stepId ? { ...s, is_completed: !s.is_completed } : s),
      }));
      const completedSteps = updatedTasks.reduce((sum, t) => sum + t.steps.filter(s => s.is_completed).length, 0);
      const allCompletedIds = updatedTasks.flatMap(t => t.steps).filter(s => s.is_completed).map(s => s.id);
      localStorage.setItem(`usebox_predefined_steps_${prev.id}`, JSON.stringify(allCompletedIds));
      return { ...prev, tasks: updatedTasks, completed_steps: completedSteps };
    });
  }, []);

  // ── Early returns for detail views ──
  if (selectedPredefined) {
    return <LabDetail lab={selectedPredefined} onBack={() => setSelectedPredefined(null)} onToggleStep={handleTogglePredefinedStep} />;
  }
  const currentSelected = selected ? labs.find(l => l.id === selected.id) || null : null;
  if (currentSelected) {
    return <LabDetail lab={currentSelected} onBack={() => setSelected(null)} onToggleStep={toggleStepComplete} />;
  }

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) { toast.error("Please enter a topic"); return; }
    await generateLab(trimmed, "intermediate", role);
    setTopic("");
    handleTabChange("my-labs");
  };

  // ── My Labs derived data ──
  // Hero shows the first in-progress lab for prominence; counts and grid include ALL labs so
  // "In progress: 1" reflects reality even when that lab is also featured above.
  const myLabsHero = labs.find(l => getLabState(l.completed_steps, l.total_steps) === "in-progress") ?? null;
  const myLabsCounts = {
    all:            labs.length,
    "not-started":  labs.filter(l => getLabState(l.completed_steps, l.total_steps) === "not-started").length,
    "in-progress":  labs.filter(l => getLabState(l.completed_steps, l.total_steps) === "in-progress").length,
    done:           labs.filter(l => getLabState(l.completed_steps, l.total_steps) === "done").length,
  };
  const myLabsFiltered = myLabsFilter === "all"
    ? labs
    : labs.filter(l => getLabState(l.completed_steps, l.total_steps) === myLabsFilter);

  // ── Predefined derived data ──
  const predefinedWithProgress = predefinedLabs.map(l => {
    const total = (l.tasks || []).reduce((sum, t) => sum + (t.steps || []).length, 0);
    const savedIds = getPredefinedProgress(l.id);
    const completed = savedIds.length;
    return { ...l, totalSteps: total, completedSteps: completed, state: getLabState(completed, total) };
  });
  const predefinedHero = predefinedWithProgress.find(l => l.state === "in-progress") ?? null;
  const predefinedCounts = {
    all:            predefinedWithProgress.length,
    "not-started":  predefinedWithProgress.filter(l => l.state === "not-started").length,
    "in-progress":  predefinedWithProgress.filter(l => l.state === "in-progress").length,
    done:           predefinedWithProgress.filter(l => l.state === "done").length,
  };
  const predefinedFiltered = predefinedFilter === "all"
    ? predefinedWithProgress
    : predefinedWithProgress.filter(l => l.state === predefinedFilter);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "generate",   label: "Generate" },
    { id: "my-labs",    label: "My Labs",   count: labs.length },
    { id: "predefined", label: "Predefined" },
  ];

  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Main tab bar ── */}
      <div className="shrink-0 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-1 px-4 sm:px-8 lg:px-12">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.id === "generate" && <Wand2 className="h-3.5 w-3.5" />}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 leading-none">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── Generate tab ── */}
          {activeTab === "generate" && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
              className="flex flex-col items-center justify-center text-center pt-[15vh] px-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <FlaskConical className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">What lab shall we build?</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-2">
                {role
                  ? <>Hands-on labs tailored for <span className="font-medium text-foreground">{ROLE_LABELS[role]}</span> — step-by-step, built instantly.</>
                  : <>Describe a topic and get a step-by-step hands-on lab built for you.</>}
              </p>
              <div className="grid sm:grid-cols-2 gap-2.5 max-w-lg mx-auto mt-6">
                {EXAMPLE_TOPICS.map(example => (
                  <button
                    key={example}
                    onClick={() => setTopic(example)}
                    disabled={generating}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── My Labs tab ── */}
          {activeTab === "my-labs" && (
            <motion.div
              key="my-labs"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
              className="w-full px-4 sm:px-8 lg:px-12 py-8"
            >
              {loading ? (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : labs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 rounded-xl border border-dashed border-border text-center">
                  <FlaskConical className="h-10 w-10 mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">No labs yet</p>
                  <p className="text-xs text-muted-foreground/70 mb-5">Generate your first lab to get started</p>
                  <Button variant="outline" size="sm" onClick={() => handleTabChange("generate")}>
                    <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Generate a lab
                  </Button>
                </div>
              ) : (
                <div className="space-y-8 max-w-4xl">

                  {/* Hero: continue learning */}
                  {myLabsHero && (
                    <section>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                        Continue learning
                      </p>
                      <HeroCard
                        title={myLabsHero.title}
                        description={myLabsHero.description}
                        completed={myLabsHero.completed_steps}
                        total={myLabsHero.total_steps}
                        onContinue={() => setSelected(myLabsHero)}
                      />
                    </section>
                  )}

                  {/* All labs grid */}
                  {labs.length > 0 && (
                    <section>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                        All labs
                      </p>
                      <FilterTabs active={myLabsFilter} counts={myLabsCounts} onChange={setMyLabsFilter} />
                      {myLabsFiltered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border text-center">
                          <FlaskConical className="h-8 w-8 mb-2 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">No labs match this filter</p>
                          <button onClick={() => setMyLabsFilter("all")} className="text-xs text-primary hover:underline mt-1">Show all</button>
                        </div>
                      ) : (
                        <AnimatePresence>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {myLabsFiltered.map((lab, i) => (
                              <LabCard
                                key={lab.id}
                                index={i}
                                title={lab.title}
                                description={lab.description}
                                totalSteps={lab.total_steps}
                                completedSteps={lab.completed_steps}
                                state={getLabState(lab.completed_steps, lab.total_steps)}
                                icon={<FlaskConical className="h-4 w-4" />}
                                onOpen={() => setSelected(lab)}
                                onDelete={() => deleteLab(lab.id)}
                              />
                            ))}
                          </div>
                        </AnimatePresence>
                      )}
                    </section>
                  )}

                  {/* Edge case: only one lab and it's in the hero */}
                  {myLabsHero && labs.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      This is your only lab — keep going!
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Predefined tab ── */}
          {activeTab === "predefined" && (
            <motion.div
              key="predefined"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
              className="w-full px-4 sm:px-8 lg:px-12 py-8"
            >
              {predefinedLoading ? (
                <div className="flex items-center justify-center py-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : predefinedLabs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 rounded-xl border border-dashed border-border text-center">
                  <BookMarked className="h-10 w-10 mb-3 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">No predefined labs</p>
                  {!role && (
                    <p className="text-xs text-muted-foreground/70">Set a Persona to see curated labs</p>
                  )}
                </div>
              ) : (
                <div className="space-y-8 max-w-4xl">

                  {/* Hero: continue learning */}
                  {predefinedHero && (
                    <section>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                        Continue learning
                      </p>
                      <HeroCard
                        title={predefinedHero.title}
                        description={predefinedHero.description || ""}
                        completed={predefinedHero.completedSteps}
                        total={predefinedHero.totalSteps}
                        onContinue={() => {
                          const saved = getPredefinedProgress(predefinedHero.id);
                          setSelectedPredefined(predefinedToLab(predefinedHero, new Set(saved)));
                        }}
                      />
                    </section>
                  )}

                  {/* All labs grid */}
                  {predefinedWithProgress.length > 0 && (
                    <section>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                        All labs
                      </p>
                      <FilterTabs active={predefinedFilter} counts={predefinedCounts} onChange={setPredefinedFilter} />
                      {predefinedFiltered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border text-center">
                          <BookMarked className="h-8 w-8 mb-2 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">No labs match this filter</p>
                          <button onClick={() => setPredefinedFilter("all")} className="text-xs text-primary hover:underline mt-1">Show all</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {predefinedFiltered.map((lab, i) => (
                            <LabCard
                              key={lab.id}
                              index={i}
                              title={lab.title}
                              description={lab.description || ""}
                              totalSteps={lab.totalSteps}
                              completedSteps={lab.completedSteps}
                              state={lab.state}
                              icon={<BookMarked className="h-4 w-4" />}
                              onOpen={() => {
                                const saved = getPredefinedProgress(lab.id);
                                setSelectedPredefined(predefinedToLab(lab, new Set(saved)));
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {predefinedHero && predefinedWithProgress.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      This is your only lab — keep going!
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Generate input pinned to bottom ── */}
      {activeTab === "generate" && (
        <div className="shrink-0 pb-4 pt-2 px-4 sm:px-8 lg:px-12">
          <div className="bg-muted/40 rounded-2xl border border-border/60 focus-within:border-primary/40 focus-within:bg-muted/60 transition-all shadow-sm">
            <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-border/40">
              <span className="text-[11px] text-muted-foreground/50 shrink-0">Generate as</span>
              <span className="text-[11px] text-foreground/60 font-medium truncate">{contextLabel}</span>
              <button
                onClick={() => setContextEditOpen(true)}
                className="ml-auto shrink-0 inline-flex items-center justify-center h-5 w-5 rounded text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-end gap-2 px-4 py-3">
              <input
                type="text"
                placeholder="Type any topic to generate lab..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
                disabled={generating}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
              />
              <Button
                onClick={handleGenerate}
                disabled={generating || !topic.trim()}
                size="icon"
                className="shrink-0 h-8 w-8 rounded-lg disabled:opacity-30"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground/60 mt-2">
            Usebox may produce inaccurate information. Verify important details.
          </p>
        </div>
      )}

      <ContextEditDialog open={contextEditOpen} onOpenChange={setContextEditOpen} />

    </div>
  );
}
