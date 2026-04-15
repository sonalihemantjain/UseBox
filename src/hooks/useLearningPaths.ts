import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface LearningPathStep {
  id: string;
  path_id: string;
  step_order: number;
  title: string;
  description: string;
  content: string;
  article_id: string | null;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_hours: number;
  icon: string;
  is_curated: boolean;
  is_ai_generated: boolean;
  user_id: string | null;
  created_at: string;
  steps: LearningPathStep[];
  enrollment?: {
    id: string;
    completed_steps: string[];
    started_at: string;
    completed_at: string | null;
  };
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown error";
};

export function useLearningPaths() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPaths = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getLearningPaths(user.id);
      setPaths((data.paths || []) as unknown as LearningPath[]);
    } catch (e) {
      console.error("Failed to fetch learning paths:", e);
      toast.error("Failed to load learning paths");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPaths(); }, [fetchPaths]);

  const enrollInPath = useCallback(async (pathId: string) => {
    if (!user) return;
    try {
      await api.enrollLearningPath({ path_id: pathId, user_id: user.id });
    } catch {
      toast.error("Failed to enroll");
      return;
    }
    toast.success("Enrolled in learning path!");
    await fetchPaths();
  }, [user, fetchPaths]);

  const toggleStepComplete = useCallback(async (pathId: string, stepId: string) => {
    if (!user) return;
    const path = paths.find(p => p.id === pathId);
    if (!path?.enrollment) return;

    const current = path.enrollment.completed_steps || [];
    const isCompleted = current.includes(stepId);
    const updated = isCompleted ? current.filter(id => id !== stepId) : [...current, stepId];
    const allDone = updated.length === path.steps.length;
    await api.toggleLearningStep({ user_id: user.id, path_id: pathId, step_id: stepId });

    if (allDone) toast.success("🎉 Learning path completed!");
    await fetchPaths();
  }, [user, paths, fetchPaths]);

  const generateAIPath = useCallback(async (goal: string, role: string, level: string) => {
    if (!user) return;
    setGenerating(true);
    try {
      await api.generateLearningPath({ user_id: user.id, goal, role, experience_level: level });
      toast.success("AI learning path generated!");
      await fetchPaths();
    } catch (e: unknown) {
      console.error(e);
      toast.error(getErrorMessage(e) || "Failed to generate path");
    } finally {
      setGenerating(false);
    }
  }, [user, fetchPaths]);

  const deleteAIPath = useCallback(async (pathId: string) => {
    if (!user) return;
    await api.deleteLearningPath({ user_id: user.id, path_id: pathId });
    toast.success("Path deleted");
    await fetchPaths();
  }, [user, fetchPaths]);

  return { paths, loading, generating, enrollInPath, toggleStepComplete, generateAIPath, deleteAIPath, refetch: fetchPaths };
}
