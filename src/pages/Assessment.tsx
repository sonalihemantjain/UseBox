import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Award, ClipboardCheck, CheckCircle2, XCircle,
  ChevronRight, ChevronLeft, RotateCcw, Trophy, X, BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAssessments } from "@/hooks/useAssessments";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

type ActiveAttempt = {
  attemptId: string;
  assessmentId: string;
  title: string;
  provider: string;
  passThreshold: number;
  questions: Array<{ id: string; question_text: string; options: string[]; question_order: number }>;
};

const PERSONA_BADGE: Record<string, { label: string; className: string }> = {
  businessuser: { label: "Business User", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  prodeveloper: { label: "Pro Developer", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  architect:    { label: "Architect",     className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  admin:        { label: "Administrator", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  "no-persona": { label: "No Persona",    className: "bg-muted/60 text-muted-foreground border-border" },
};

const getPersonaBadge = (persona?: string | null) =>
  PERSONA_BADGE[persona ?? "no-persona"] ?? PERSONA_BADGE["no-persona"];

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

export default function Assessment() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { role }  = useUserRole();
  const { catalog, certificates, loading, submitting, loadCatalog, loadCertificates, start, submit } = useAssessments();

  const [activeAttempt, setActiveAttempt] = useState<ActiveAttempt | null>(null);
  const [answers,       setAnswers]       = useState<Record<string, string>>({});
  const [currentIdx,    setCurrentIdx]    = useState(0);
  const [result, setResult] = useState<{
    passed: boolean; score_percent: number;
    correct_answers: number; total_questions: number; certificate_code?: string;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadCatalog(role);
    loadCertificates(user.id);
  }, [user?.id, role, loadCatalog, loadCertificates]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const totalQ        = activeAttempt?.questions.length ?? 0;
  const currentQ      = activeAttempt?.questions[currentIdx] ?? null;
  const progressPct   = totalQ ? Math.round((answeredCount / totalQ) * 100) : 0;
  const isLastQ       = currentIdx === totalQ - 1;
  const allAnswered   = answeredCount === totalQ;

  const openModal = async (assessmentId: string) => {
    if (!user?.id) return;
    try {
      const res = await start({ user_id: user.id, assessment_id: assessmentId, persona: role });
      setActiveAttempt({
        attemptId:     res.attempt_id,
        assessmentId:  res.assessment_id,
        title:         res.title,
        provider:      res.provider,
        passThreshold: res.pass_threshold,
        questions:     res.questions || [],
      });
      setAnswers({});
      setCurrentIdx(0);
      setResult(null);
    } catch {
      toast.error("Failed to start assessment");
    }
  };

  const closeModal = () => {
    setActiveAttempt(null);
    setResult(null);
  };

  const submitAssessment = async () => {
    if (!user?.id || !activeAttempt) return;
    try {
      const res = await submit(activeAttempt.attemptId, {
        user_id: user.id,
        answers: Object.entries(answers).map(([question_id, selected_option]) => ({ question_id, selected_option })),
      });
      setResult({
        passed:           res.passed,
        score_percent:    res.score_percent,
        correct_answers:  res.correct_answers,
        total_questions:  res.total_questions,
        certificate_code: res.certificate?.certificate_code,
      });
      if (res.passed) {
        toast.success("Assessment passed! Certificate issued.");
        if (user?.id) await loadCertificates(user.id);
      }
    } catch {
      toast.error("Failed to submit assessment");
    }
  };

  const selectOption = (questionId: string, opt: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: opt }));
  };

  // ─── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-1">Assessment</h1>
            <p className="text-muted-foreground text-sm">Test your knowledge and earn certifications.</p>
          </div>
          {certificates.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Award className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-600">
                {certificates.length} certificate{certificates.length > 1 ? "s" : ""} earned
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left — My Assessments (Certificates) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">My Assessments</h2>
              {certificates.length > 0 && (
                <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5">
                  {certificates.length}
                </span>
              )}
            </div>

            {certificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border text-center">
                <Trophy className="h-10 w-10 mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-1">No certificates yet</p>
                <p className="text-xs text-muted-foreground/70">Pass an assessment on the right to earn one</p>
              </div>
            ) : (
              <div className="space-y-3">
                {certificates.map((c) => (
                  <motion.div
                    key={c.id}
                    whileHover={{ y: -1 }}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Award className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.topic}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{c.provider}</span>
                        <span className="text-[10px] font-mono text-primary">{c.certificate_code}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-emerald-600">{c.score_percent}%</span>
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => navigate(`/assessment/certificate/${c.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right — Available Assessments (Catalog) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Available Assessments</h2>
              <span className="text-xs text-muted-foreground ml-1">by Usebox</span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : catalog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border">
                <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No assessments available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {catalog.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{item.provider}</p>
                      <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        getPersonaBadge(role).className
                      )}>
                        {getPersonaBadge(role).label}
                      </span>
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={() => openModal(item.id)}>
                        Start <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

        </div>
      </div>

      {/* ─── Full-screen Quiz Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {activeAttempt && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-card rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {activeAttempt.provider}
                  </p>
                  <h2 className="text-base font-semibold text-foreground truncate">{activeAttempt.title}</h2>
                </div>
                <button
                  onClick={closeModal}
                  className="ml-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress bar */}
              {!result && (
                <div className="px-6 py-3 border-b border-border shrink-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Question {currentIdx + 1} of {totalQ}</span>
                    <span>{answeredCount} answered · Pass: {activeAttempt.passThreshold}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      animate={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}
                      transition={{ ease: "easeOut", duration: 0.3 }}
                    />
                  </div>
                  {/* Question dot indicators */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {activeAttempt.questions.map((q, i) => (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          i === currentIdx
                            ? "bg-primary w-4"
                            : answers[q.id]
                              ? "bg-primary/40 w-1.5"
                              : "bg-muted-foreground/20 w-1.5"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <AnimatePresence mode="wait">
                  {result ? (
                    /* ── Result ── */
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center text-center py-4"
                    >
                      <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center mb-5",
                        result.passed ? "bg-emerald-500/10" : "bg-red-500/10"
                      )}>
                        {result.passed
                          ? <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                          : <XCircle className="h-10 w-10 text-red-500" />}
                      </div>
                      <h3 className="text-2xl font-bold mb-1">
                        {result.passed ? "You Passed!" : "Not Quite"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                        {result.passed
                          ? "Great work! Your certificate has been issued."
                          : `You need ${activeAttempt.passThreshold}% to pass. Give it another shot!`}
                      </p>
                      <div className={cn(
                        "rounded-2xl border px-10 py-5 mb-6",
                        result.passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                      )}>
                        <div className={cn(
                          "text-5xl font-bold mb-1",
                          result.passed ? "text-emerald-600" : "text-red-600"
                        )}>
                          {result.score_percent}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.correct_answers} / {result.total_questions} correct
                        </div>
                        {result.certificate_code && (
                          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                            Certificate: <span className="font-mono font-semibold text-primary">{result.certificate_code}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap justify-center">
                        {!result.passed && (
                          <Button onClick={() => openModal(activeAttempt.assessmentId)}>
                            <RotateCcw className="h-4 w-4 mr-1.5" /> Try Again
                          </Button>
                        )}
                        <Button variant="outline" onClick={closeModal}>
                          {result.passed ? "Done" : "Back to Catalog"}
                        </Button>
                      </div>
                    </motion.div>
                  ) : currentQ ? (
                    /* ── Single Question ── */
                    <motion.div
                      key={currentQ.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <p className="text-base font-semibold text-foreground leading-relaxed">
                        {currentQ.question_text}
                      </p>
                      <div className="space-y-2.5">
                        {currentQ.options.map((opt, oi) => {
                          const selected = answers[currentQ.id] === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => selectOption(currentQ.id, opt)}
                              className={cn(
                                "w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center gap-3",
                                selected
                                  ? "border-primary bg-primary/8 shadow-sm"
                                  : "border-border hover:border-primary/30 hover:bg-muted/40"
                              )}
                            >
                              <span className={cn(
                                "inline-flex items-center justify-center h-6 w-6 rounded-full border text-xs font-bold shrink-0",
                                selected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-border text-muted-foreground"
                              )}>
                                {OPTION_LABELS[oi]}
                              </span>
                              <span className={cn(
                                "text-sm",
                                selected ? "text-foreground font-medium" : "text-muted-foreground"
                              )}>
                                {opt}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Modal footer — navigation */}
              {!result && (
                <div className="px-6 pb-5 pt-3 border-t border-border flex items-center justify-between shrink-0">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                    disabled={currentIdx === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>

                  {isLastQ ? (
                    <Button
                      size="sm"
                      onClick={submitAssessment}
                      disabled={submitting || !allAnswered}
                    >
                      {submitting
                        ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Submitting…</>
                        : allAnswered ? "Submit Assessment" : `${totalQ - answeredCount} unanswered`}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setCurrentIdx(i => Math.min(totalQ - 1, i + 1))}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
