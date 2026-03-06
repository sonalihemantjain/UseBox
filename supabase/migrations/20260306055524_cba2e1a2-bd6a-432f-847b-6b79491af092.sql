
-- Knowledge articles table (curated + user-uploaded)
CREATE TABLE public.knowledge_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  source_type TEXT NOT NULL DEFAULT 'curated' CHECK (source_type IN ('curated', 'uploaded')),
  file_url TEXT,
  icon TEXT NOT NULL DEFAULT 'book',
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read public articles
CREATE POLICY "Anyone can read public articles"
  ON public.knowledge_articles FOR SELECT TO authenticated
  USING (is_public = true OR user_id = auth.uid());

-- Users can insert their own articles
CREATE POLICY "Users can insert own articles"
  ON public.knowledge_articles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update own articles
CREATE POLICY "Users can update own articles"
  ON public.knowledge_articles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Users can delete own articles
CREATE POLICY "Users can delete own articles"
  ON public.knowledge_articles FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Bookmarks table
CREATE TABLE public.knowledge_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_id UUID REFERENCES public.knowledge_articles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

ALTER TABLE public.knowledge_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bookmarks"
  ON public.knowledge_bookmarks FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Reading progress table
CREATE TABLE public.knowledge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_id UUID REFERENCES public.knowledge_articles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'reading', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

ALTER TABLE public.knowledge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own progress"
  ON public.knowledge_progress FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Storage bucket for uploaded documents
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-docs', 'knowledge-docs', true);

CREATE POLICY "Authenticated users can upload docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'knowledge-docs');

CREATE POLICY "Anyone authenticated can read docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'knowledge-docs');

CREATE POLICY "Users can delete own docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'knowledge-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
