
-- Learning paths table
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  estimated_hours NUMERIC NOT NULL DEFAULT 1,
  icon TEXT NOT NULL DEFAULT 'route',
  is_curated BOOLEAN NOT NULL DEFAULT false,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Steps within a learning path
CREATE TABLE public.learning_path_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  article_id UUID REFERENCES public.knowledge_articles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User enrollments / progress
CREATE TABLE public.learning_path_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed_steps UUID[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(path_id, user_id)
);

-- RLS
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_enrollments ENABLE ROW LEVEL SECURITY;

-- learning_paths: anyone can read curated, users can read their own AI-generated
CREATE POLICY "Read curated or own paths" ON public.learning_paths
  FOR SELECT TO authenticated
  USING (is_curated = true OR user_id = auth.uid());

CREATE POLICY "Users insert own paths" ON public.learning_paths
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own paths" ON public.learning_paths
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- learning_path_steps: readable if user can read the path
CREATE POLICY "Read steps of accessible paths" ON public.learning_path_steps
  FOR SELECT TO authenticated
  USING (path_id IN (SELECT id FROM public.learning_paths WHERE is_curated = true OR user_id = auth.uid()));

-- enrollments: users manage own
CREATE POLICY "Users manage own enrollments" ON public.learning_path_enrollments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
