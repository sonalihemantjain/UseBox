import { useEffect, useMemo, useState } from "react";
import { Loader2, Award, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAssessments } from "@/hooks/useAssessments";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type ActiveAttempt = {
  attemptId: string;
  assessmentId: string;
  title: string;
  provider: string;
  passThreshold: number;
  questions: Array<{ id: string; question_text: string; options: string[]; question_order: number }>;
};

export default function Assessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { catalog, certificates, loading, submitting, loadCatalog, loadCertificates, start, submit } = useAssessments();
  const [activeAttempt, setActiveAttempt] = useState<ActiveAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    passed: boolean;
    score_percent: number;
    correct_answers: number;
    total_questions: number;
    certificate_code?: string;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadCatalog();
    loadCertificates(user.id);
  }, [user?.id, loadCatalog, loadCertificates]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const startAssessment = async (assessmentId: string) => {
    if (!user?.id) return;
    try {
      const res = await start({ user_id: user.id, assessment_id: assessmentId });
      setActiveAttempt({
        attemptId: res.attempt_id,
        assessmentId: res.assessment_id,
        title: res.title,
        provider: res.provider,
        passThreshold: res.pass_threshold,
        questions: res.questions || [],
      });
      setAnswers({});
      setResult(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to start assessment");
    }
  };

  const submitAssessment = async () => {
    if (!user?.id || !activeAttempt) return;
    try {
      const payload = {
        user_id: user.id,
        answers: Object.entries(answers).map(([question_id, selected_option]) => ({ question_id, selected_option })),
      };
      const res = await submit(activeAttempt.attemptId, payload);
      setResult({
        passed: res.passed,
        score_percent: res.score_percent,
        correct_answers: res.correct_answers,
        total_questions: res.total_questions,
        certificate_code: res.certificate?.certificate_code,
      });
      if (res.passed) {
        toast.success("Assessment passed. Certificate issued.");
        await loadCertificates(user.id);
      } else {
        toast.error("Not passed", {
          description: `Score ${res.score_percent}% (${res.correct_answers}/${res.total_questions}). Try again to reach ${activeAttempt.passThreshold}%.`,
          action: {
            label: "Retry",
            onClick: () => startAssessment(activeAttempt.assessmentId),
          },
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit assessment");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Assessment</h1>
          <p className="text-muted-foreground text-base">
            Take assessments for completed labs and earn certifications.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Available Assessments
            </h2>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : catalog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assessments available.</p>
            ) : (
              <div className="space-y-3">
                {catalog.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border p-3">
                    <div className="text-xs text-muted-foreground">{item.provider}</div>
                    <div className="text-sm font-medium mt-1">{item.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 capitalize">{item.level}</div>
                    <div className="text-xs text-muted-foreground mt-2 line-clamp-3">{item.description}</div>
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => startAssessment(item.id)}
                    >
                      Start Assessment
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-2 rounded-xl border border-border bg-card p-5">
            {!activeAttempt ? (
              <p className="text-sm text-muted-foreground">
                Start an assessment from the left panel to see questions.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{activeAttempt.title}</h3>
                    <p className="text-xs text-muted-foreground">{activeAttempt.provider}</p>
                    <p className="text-xs text-muted-foreground">
                      Pass threshold: {activeAttempt.passThreshold}% | Answered: {answeredCount}/{activeAttempt.questions.length}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {activeAttempt.questions.map((q) => (
                    <div key={q.id} className="rounded-lg border border-border p-4">
                      <p className="text-sm font-medium mb-3">
                        {q.question_order}. {q.question_text}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt) => (
                          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={answers[q.id] === opt}
                              onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={submitAssessment}
                    disabled={submitting || answeredCount < activeAttempt.questions.length}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Submit Assessment
                  </Button>
                  <Button variant="outline" onClick={() => setActiveAttempt(null)}>
                    Cancel
                  </Button>
                </div>

                {result && (
                  <div className="rounded-lg border border-border p-4 bg-muted/30">
                    <p className="text-sm font-semibold">
                      Result: {result.passed ? "Passed" : "Not Passed"} ({result.score_percent}%)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Correct: {result.correct_answers}/{result.total_questions}
                    </p>
                    {result.certificate_code && (
                      <p className="text-xs text-primary mt-1">Certificate code: {result.certificate_code}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" /> Certificates
          </h2>
          {certificates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No certificates yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {certificates.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-semibold">{c.topic}</p>
                  <p className="text-xs text-muted-foreground mt-1">Code: {c.certificate_code}</p>
                  <p className="text-xs text-muted-foreground">Score: {c.score_percent}%</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => navigate(`/assessment/certificate/${c.id}`)}
                  >
                    View Certificate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

