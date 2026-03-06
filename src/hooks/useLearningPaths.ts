import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

export function useLearningPaths() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPaths = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: pathsData }, { data: stepsData }, { data: enrollmentsData }] = await Promise.all([
      supabase.from("learning_paths").select("*").order("created_at"),
      supabase.from("learning_path_steps").select("*").order("step_order"),
      supabase.from("learning_path_enrollments").select("*").eq("user_id", user.id),
    ]);

    const stepsMap = new Map<string, LearningPathStep[]>();
    (stepsData ?? []).forEach((s: any) => {
      const list = stepsMap.get(s.path_id) || [];
      list.push(s);
      stepsMap.set(s.path_id, list);
    });

    const enrollMap = new Map<string, any>();
    (enrollmentsData ?? []).forEach((e: any) => enrollMap.set(e.path_id, e));

    const enriched: LearningPath[] = (pathsData ?? []).map((p: any) => ({
      ...p,
      steps: stepsMap.get(p.id) || [],
      enrollment: enrollMap.get(p.id) || undefined,
    }));

    setPaths(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPaths(); }, [fetchPaths]);

  const enrollInPath = useCallback(async (pathId: string) => {
    if (!user) return;
    const { error } = await supabase.from("learning_path_enrollments").insert({
      path_id: pathId,
      user_id: user.id,
    });
    if (error) { toast.error("Failed to enroll"); return; }
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

    await supabase.from("learning_path_enrollments").update({
      completed_steps: updated,
      completed_at: allDone ? new Date().toISOString() : null,
    }).eq("id", path.enrollment.id);

    if (allDone) toast.success("🎉 Learning path completed!");
    await fetchPaths();
  }, [user, paths, fetchPaths]);

  const generateAIPath = useCallback(async (goal: string, role: string, level: string) => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-learning-path", {
        body: { goal, role, experience_level: level },
      });
      if (error) throw error;

      // Save the generated path
      const { data: newPath, error: insertErr } = await supabase.from("learning_paths").insert({
        title: data.title,
        description: data.description,
        category: data.category || "learning",
        difficulty: data.difficulty || level,
        estimated_hours: data.estimated_hours || 3,
        icon: "sparkles",
        is_curated: false,
        is_ai_generated: true,
        user_id: user.id,
      }).select().single();

      if (insertErr || !newPath) throw insertErr;

      // Insert steps
      const steps = (data.steps || []).map((s: any, i: number) => ({
        path_id: newPath.id,
        step_order: i + 1,
        title: s.title,
        description: s.description,
        content: s.content || '',
      }));

      if (steps.length > 0) {
        // Insert steps one by one to avoid RLS issues
        for (const step of steps) {
          await supabase.from("learning_path_steps").insert(step);
        }
      }

      // Auto-enroll
      await supabase.from("learning_path_enrollments").insert({
        path_id: newPath.id,
        user_id: user.id,
      });

      toast.success("AI learning path generated!");
      await fetchPaths();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to generate path");
    } finally {
      setGenerating(false);
    }
  }, [user, fetchPaths]);

  const deleteAIPath = useCallback(async (pathId: string) => {
    if (!user) return;
    await supabase.from("learning_paths").delete().eq("id", pathId);
    toast.success("Path deleted");
    await fetchPaths();
  }, [user, fetchPaths]);

  return { paths, loading, generating, enrollInPath, toggleStepComplete, generateAIPath, deleteAIPath, refetch: fetchPaths };
}
