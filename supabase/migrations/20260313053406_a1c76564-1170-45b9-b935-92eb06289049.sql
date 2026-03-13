
-- Article likes table
CREATE TABLE public.article_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);

ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own likes" ON public.article_likes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read likes" ON public.article_likes
  FOR SELECT TO authenticated
  USING (true);

-- Article comments table
CREATE TABLE public.article_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own comments" ON public.article_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read comments" ON public.article_comments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can delete own comments" ON public.article_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Article shares table
CREATE TABLE public.article_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.article_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shares" ON public.article_shares
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read shares" ON public.article_shares
  FOR SELECT TO authenticated
  USING (true);

-- Function to award credits on like
CREATE OR REPLACE FUNCTION public.award_credit_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  article_author_id uuid;
BEGIN
  SELECT user_id INTO article_author_id FROM knowledge_articles WHERE id = NEW.article_id;
  IF article_author_id IS NOT NULL AND article_author_id != NEW.user_id THEN
    INSERT INTO user_credits (user_id, total_credits)
    VALUES (article_author_id, 1)
    ON CONFLICT (user_id) DO UPDATE SET total_credits = user_credits.total_credits + 1, updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_award_credit_on_like
  AFTER INSERT ON public.article_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.award_credit_on_like();

-- Full-text search function for RAG
CREATE OR REPLACE FUNCTION public.search_knowledge(search_query text, max_results int DEFAULT 3)
RETURNS TABLE(id uuid, title text, description text, content text, user_id uuid, category text, tags text[], icon text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ka.id, ka.title, ka.description, ka.content, ka.user_id, ka.category, ka.tags, ka.icon
  FROM knowledge_articles ka
  WHERE ka.approval_status = 'approved'
    AND ka.is_public = true
    AND (
      to_tsvector('english', ka.title || ' ' || ka.description || ' ' || ka.content)
      @@ plainto_tsquery('english', search_query)
      OR ka.title ILIKE '%' || search_query || '%'
      OR ka.description ILIKE '%' || search_query || '%'
    )
  ORDER BY ts_rank(
    to_tsvector('english', ka.title || ' ' || ka.description || ' ' || ka.content),
    plainto_tsquery('english', search_query)
  ) DESC
  LIMIT max_results;
$$;
