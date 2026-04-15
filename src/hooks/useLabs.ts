import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api, type ApiLab } from "@/lib/api";

export interface LabTaskStep {
  id: string;
  task_id: string;
  step_order: number;
  title: string;
  content: string;
  is_completed: boolean;
}

export interface LabTask {
  id: string;
  lab_id: string;
  task_order: number;
  title: string;
  description: string;
  steps: LabTaskStep[];
}

export interface Lab {
  id: string;
  user_id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: string;
  total_steps: number;
  completed_steps: number;
  status: string;
  created_at: string;
  tasks: LabTask[];
  task_states?: Record<string, boolean>;
  assessment_ready?: boolean;
  assessment_question_count?: number;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown error";
};

export function useLabs(options?: { autoFetch?: boolean }) {
  const { user } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const autoFetch = options?.autoFetch ?? true; // Default to true for backward compatibility

  const fetchLabs = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const apiLabs = await api.getLabsForUser(user.id);
      const mappedLabs: Lab[] = (apiLabs || []).map((al: ApiLab) => ({
        id: al.id,
        user_id: user.id,
        title: al.title,
        description: al.description || al.goal || String(al.raw || "").substring(0, 100) + "...",
        topic: al.topic || al.question || "",
        difficulty: al.difficulty || "intermediate",
        total_steps: al.total_steps || 0,
        completed_steps: al.completed_steps || 0,
        status: al.status || "in_progress",
        created_at: al.created_at,
        task_states: al.task_states,
        tasks: (al.tasks || []).map((at) => ({
          id: at.id,
          lab_id: al.id,
          task_order: at.task_order,
          title: at.title,
          description: at.description || "",
          steps: (at.steps || []).map((step) => ({
            id: step.id,
            task_id: at.id,
            step_order: step.step_order,
            title: step.title,
            content: step.content,
            is_completed: step.is_completed || false
          }))
        }))
      }));

      // Fetch cached assessment readiness for completed labs (batch, single call)
      const completedIds = mappedLabs.filter((l) => l.status === "completed").map((l) => l.id);
      if (completedIds.length > 0) {
        try {
          const status = await api.getAssessmentQuestionSetStatus({ user_id: user.id, lab_ids: completedIds });
          const readyBy = status.readyByLabId || {};
          mappedLabs.forEach((l) => {
            if (l.status !== "completed") return;
            const s = readyBy[l.id];
            if (s) {
              l.assessment_ready = Boolean(s.ready);
              l.assessment_question_count = s.question_count || 0;
            } else {
              l.assessment_ready = false;
              l.assessment_question_count = 0;
            }
          });
        } catch (e) {
          // Non-blocking: labs should still render even if status check fails
          mappedLabs.forEach((l) => {
            if (l.status === "completed") l.assessment_ready = false;
          });
        }
      }
      setLabs(mappedLabs);
    } catch (err) {
      console.error('Error in fetchLabs:', err);
      toast.error("Failed to load labs");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { 
    if (autoFetch) {
      fetchLabs(); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, autoFetch]); // Only re-fetch when user ID changes and autoFetch is enabled

  const generateLab = useCallback(async (topic: string, difficulty: string = "intermediate") => {
    if (!user) return;
    setGenerating(true);
    try {
      console.log('🧪 Starting lab generation for topic:', topic);
      const data = await api.generateLab({ topic, difficulty, user_id: user.id });
      console.log('✅ Lab data received from API:', data);

      toast.success("Lab created successfully!");
      await fetchLabs();
      return data?.id;
    } catch (e: unknown) {
      console.error(e);
      toast.error(getErrorMessage(e) || "Failed to generate lab");
    } finally {
      setGenerating(false);
    }
  }, [user, fetchLabs]);

  const toggleStepComplete = useCallback(async (labId: string, stepId: string) => {
    const lab = labs.find(l => l.id === labId);
    if (!lab) return;

    // Find the step
    let targetStep: LabTaskStep | undefined;
    for (const task of lab.tasks) {
      targetStep = task.steps.find(s => s.id === stepId);
      if (targetStep) break;
    }
    if (!targetStep) return;

    const newCompleted = !targetStep.is_completed;
    
    try {
      // Update task_states locally
      const newTaskStates = { ...(lab.task_states || {}) };
      newTaskStates[targetStep.content] = newCompleted;

      // The API expects the tasks in the background format
      const apiTasks = lab.tasks.map(t => ({
        title: t.title,
        description: t.description,
        subtasks: t.steps.map(s => s.content)
      }));

      await api.updateLabProgress(labId, { task_states: newTaskStates, tasks: apiTasks });
      const newCompletedCount = lab.tasks.reduce((sum, t) =>
        sum + t.steps.filter(s => s.id === stepId ? newCompleted : s.is_completed).length, 0
      );
      const allDone = newCompletedCount === lab.total_steps;
      if (allDone) toast.success("🎉 Lab completed!");
      await fetchLabs();
    } catch (err) {
      console.error('Error toggling step:', err);
      toast.error("Failed to update step progress");
    }
  }, [labs, fetchLabs]);

  const deleteLab = useCallback(async (labId: string) => {
    try {
      await api.deleteLab(labId);
      toast.success("Lab deleted");
      await fetchLabs();
    } catch (err) {
      console.error('Error deleting lab:', err);
      toast.error("Failed to delete lab");
    }
  }, [fetchLabs]);

  const fetchLabFromApi = useCallback(async (labId: string) => {
    try {
      return await api.getLabById(labId);
    } catch (e) {
      console.error("Error fetching lab from API:", e);
      return null;
    }
  }, []);

  return { labs, loading, generating, generateLab, toggleStepComplete, deleteLab, fetchLabFromApi, refetch: fetchLabs };
}
