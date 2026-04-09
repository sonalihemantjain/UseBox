import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
}

export function useLabs() {
  const { user } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchLabs = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: labsData }, { data: tasksData }, { data: stepsData }] = await Promise.all([
      supabase.from("labs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("lab_tasks").select("*").order("task_order"),
      supabase.from("lab_task_steps").select("*").order("step_order"),
    ]);

    const stepsMap = new Map<string, LabTaskStep[]>();
    (stepsData ?? []).forEach((s: any) => {
      const list = stepsMap.get(s.task_id) || [];
      list.push(s);
      stepsMap.set(s.task_id, list);
    });

    const tasksMap = new Map<string, LabTask[]>();
    (tasksData ?? []).forEach((t: any) => {
      const task: LabTask = { ...t, steps: stepsMap.get(t.id) || [] };
      const list = tasksMap.get(t.lab_id) || [];
      list.push(task);
      tasksMap.set(t.lab_id, list);
    });

    const enriched: Lab[] = (labsData ?? []).map((l: any) => ({
      ...l,
      tasks: tasksMap.get(l.id) || [],
    }));

    setLabs(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchLabs(); }, [fetchLabs]);

  const generateLab = useCallback(async (topic: string, difficulty: string = "intermediate") => {
    if (!user) return;
    setGenerating(true);
    try {
      console.log('🧪 Starting lab generation for topic:', topic);
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/labs/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, difficulty }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Lab data received from API:', data);

      // Create lab record
      const totalSteps = (data.tasks || []).reduce((sum: number, t: any) => sum + (t.steps?.length || 0), 0);
      const { data: newLab, error: labErr } = await supabase.from("labs").insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        topic,
        difficulty: data.difficulty || difficulty,
        total_steps: totalSteps,
        completed_steps: 0,
        status: "in_progress",
      }).select().single();

      if (labErr || !newLab) throw labErr;

      // Insert tasks and steps
      for (let ti = 0; ti < (data.tasks || []).length; ti++) {
        const taskData = data.tasks[ti];
        const { data: newTask, error: taskErr } = await supabase.from("lab_tasks").insert({
          lab_id: newLab.id,
          task_order: ti + 1,
          title: taskData.title,
          description: taskData.description || "",
        }).select().single();

        if (taskErr || !newTask) continue;

        for (let si = 0; si < (taskData.steps || []).length; si++) {
          const stepData = taskData.steps[si];
          await supabase.from("lab_task_steps").insert({
            task_id: newTask.id,
            step_order: si + 1,
            title: stepData.title,
            content: stepData.content || "",
            is_completed: false,
          });
        }
      }

      toast.success("Lab created successfully!");
      await fetchLabs();
      return newLab.id;
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to generate lab");
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
    await supabase.from("lab_task_steps").update({ is_completed: newCompleted }).eq("id", stepId);

    // Recalculate completed steps
    const newCompletedCount = lab.tasks.reduce((sum, t) =>
      sum + t.steps.filter(s => s.id === stepId ? newCompleted : s.is_completed).length, 0
    );
    const allDone = newCompletedCount === lab.total_steps;

    await supabase.from("labs").update({
      completed_steps: newCompletedCount,
      status: allDone ? "completed" : "in_progress",
      updated_at: new Date().toISOString(),
    }).eq("id", labId);

    if (allDone) toast.success("🎉 Lab completed!");
    await fetchLabs();
  }, [labs, fetchLabs]);

  const deleteLab = useCallback(async (labId: string) => {
    await supabase.from("labs").delete().eq("id", labId);
    toast.success("Lab deleted");
    await fetchLabs();
  }, [fetchLabs]);

  return { labs, loading, generating, generateLab, toggleStepComplete, deleteLab, refetch: fetchLabs };
}
