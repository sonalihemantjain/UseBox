
-- Labs table
CREATE TABLE public.labs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  total_steps INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own labs" ON public.labs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Lab tasks table
CREATE TABLE public.lab_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
  task_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own lab tasks" ON public.lab_tasks
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT id FROM public.labs WHERE user_id = auth.uid()));

CREATE POLICY "Users insert own lab tasks" ON public.lab_tasks
  FOR INSERT TO authenticated
  WITH CHECK (lab_id IN (SELECT id FROM public.labs WHERE user_id = auth.uid()));

CREATE POLICY "Users delete own lab tasks" ON public.lab_tasks
  FOR DELETE TO authenticated
  USING (lab_id IN (SELECT id FROM public.labs WHERE user_id = auth.uid()));

-- Lab task steps table
CREATE TABLE public.lab_task_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.lab_tasks(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_task_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own lab task steps" ON public.lab_task_steps
  FOR SELECT TO authenticated
  USING (task_id IN (SELECT lt.id FROM public.lab_tasks lt JOIN public.labs l ON lt.lab_id = l.id WHERE l.user_id = auth.uid()));

CREATE POLICY "Users insert own lab task steps" ON public.lab_task_steps
  FOR INSERT TO authenticated
  WITH CHECK (task_id IN (SELECT lt.id FROM public.lab_tasks lt JOIN public.labs l ON lt.lab_id = l.id WHERE l.user_id = auth.uid()));

CREATE POLICY "Users update own lab task steps" ON public.lab_task_steps
  FOR UPDATE TO authenticated
  USING (task_id IN (SELECT lt.id FROM public.lab_tasks lt JOIN public.labs l ON lt.lab_id = l.id WHERE l.user_id = auth.uid()));
