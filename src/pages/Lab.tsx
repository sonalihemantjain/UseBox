import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Loader2, Wand2, BookMarked, ChevronRight, Trash2, Clock, Sparkles } from "lucide-react";
import { useLabs, type Lab } from "@/hooks/useLabs";
import { useUserRole, ROLE_LABELS } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { LabDetail } from "@/components/lab/LabDetail";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import type { ApiLab } from "@/lib/api";
import { toast } from "sonner";

const PERSONA_BADGE: Record<string, { label: string; className: string }> = {
  businessuser:  { label: "Business User",  className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  prodeveloper:  { label: "Pro Developer",  className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  architect:     { label: "Architect",      className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  admin:         { label: "Administrator",  className: "bg-red-500/10 text-red-600 border-red-500/20" },
  "no-persona":  { label: "No Persona",     className: "bg-muted/60 text-muted-foreground border-border" },
};

const getPersonaBadge = (persona: string) =>
  PERSONA_BADGE[persona] ?? PERSONA_BADGE["no-persona"];

export default function Lab() {
  const { labs, loading, generating, generateLab, toggleStepComplete, deleteLab, refetch } = useLabs();
  const { role } = useUserRole();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Lab | null>(null);
  const [topic, setTopic] = useState("");

  const [predefinedLabs, setPredefinedLabs] = useState<ApiLab[]>([]);
  const [predefinedLoading, setPredefinedLoading] = useState(false);
  const [startingLabId, setStartingLabId] = useState<string | null>(null);

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

  useEffect(() => {
    loadPredefined(role);
  }, [role, loadPredefined]);

  const currentSelected = selected ? labs.find(l => l.id === selected.id) || null : null;

  if (currentSelected) {
    return (
      <LabDetail
        lab={currentSelected}
        onBack={() => setSelected(null)}
        onToggleStep={toggleStepComplete}
      />
    );
  }

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) { toast.error("Please enter a topic"); return; }
    await generateLab(trimmed, "intermediate", role);
    setTopic("");
  };

  const handleStartPredefined = async (lab: ApiLab) => {
    if (!user?.id) { toast.error("Please log in first"); return; }
    setStartingLabId(lab.id);
    try {
      const result = await api.startPredefinedLab(lab.id, { user_id: user.id, persona: role });
      toast.success(`"${result.title}" added to My Labs`);
      await refetch();
    } catch {
      toast.error("Failed to start lab");
    } finally {
      setStartingLabId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-1">Labs</h1>
          <p className="text-muted-foreground">Hands-on labs to build real-world skills</p>
        </motion.div>

        {/* ── Generate bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Generate a Lab</span>
            {role && (
              <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Tailored for <span className="font-medium text-foreground ml-1">{ROLE_LABELS[role]}</span>
              </span>
            )}
          </div>

          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="text"
              placeholder="Type any topic — e.g. Build a chatbot with Copilot Studio"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              disabled={generating}
              className="flex-1 h-10 px-4 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
            <Button onClick={handleGenerate} disabled={generating || !topic.trim()} className="gap-2 shrink-0">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {generating ? "Generating…" : "Generate"}
            </Button>
          </div>

          {!role && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Select a <span className="font-medium text-foreground mx-0.5">Persona</span> from the domain bar above to get a lab tailored to your level
            </p>
          )}
        </motion.div>

        {/* ── Two-column content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left — My Labs */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">My Labs</h2>
              {labs.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5">
                  {labs.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : labs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border text-center">
                <FlaskConical className="h-10 w-10 mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-1">No labs yet</p>
                <p className="text-xs text-muted-foreground/70">Generate one above or start a predefined lab</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {labs.map((lab, i) => {
                    const pct = lab.total_steps > 0 ? Math.round((lab.completed_steps / lab.total_steps) * 100) : 0;
                    return (
                      <motion.div
                        key={lab.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.05 }}
                        className="group rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => setSelected(lab)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                            <FlaskConical className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <h3 className="text-sm font-semibold truncate">{lab.title}</h3>
                              <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPersonaBadge(lab.persona).className}`}>
                                {getPersonaBadge(lab.persona).label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{lab.description}</p>
                            <div className="flex items-center gap-3">
                              <Progress value={pct} className="h-1 flex-1" />
                              <span className="text-[10px] text-muted-foreground shrink-0">{lab.completed_steps}/{lab.total_steps}</span>
                            </div>
                          </div>
                          <button
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                            onClick={(e) => { e.stopPropagation(); deleteLab(lab.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 mt-2 pl-9">
                          <Clock className="h-3 w-3 text-muted-foreground/50" />
                          <span className="text-[10px] text-muted-foreground/50">
                            {new Date(lab.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Right — Predefined */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-2 mb-4">
              <BookMarked className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Predefined Labs</h2>
              <span className="text-xs text-muted-foreground ml-1">by UseBox</span>
              {role && (
                <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPersonaBadge(role).className}`}>
                  {getPersonaBadge(role).label}
                </span>
              )}
            </div>

            {predefinedLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : predefinedLabs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border text-center">
                <BookMarked className="h-10 w-10 mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-1">No predefined labs</p>
                {!role && (
                  <p className="text-xs text-muted-foreground/70">Select a Persona above to see curated labs</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {predefinedLabs.map((lab, i) => {
                  const isStarting = startingLabId === lab.id;
                  return (
                    <motion.div
                      key={lab.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all"
                      onClick={() => !isStarting && handleStartPredefined(lab)}
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <BookMarked className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate mb-0.5">{lab.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">{lab.description}</p>
                      </div>
                      <div className="shrink-0">
                        {isStarting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}
