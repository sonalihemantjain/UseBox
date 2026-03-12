
-- Track views on articles
CREATE TABLE public.article_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert views"
  ON public.article_views FOR INSERT
  TO authenticated
  WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "Users can read views on own articles"
  ON public.article_views FOR SELECT
  TO authenticated
  USING (
    article_id IN (
      SELECT id FROM public.knowledge_articles WHERE user_id = auth.uid()
    )
    OR viewer_id = auth.uid()
  );

-- User credits table
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_credits numeric NOT NULL DEFAULT 0,
  redeemed_credits numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own credits"
  ON public.user_credits FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Credit redemptions
CREATE TABLE public.credit_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own redemptions"
  ON public.credit_redemptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
