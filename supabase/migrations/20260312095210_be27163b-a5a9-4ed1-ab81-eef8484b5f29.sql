CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  selected_models TEXT[] NOT NULL DEFAULT ARRAY['google/gemini-3-flash-preview', 'openai/gpt-5-mini'],
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX user_settings_user_id_idx ON public.user_settings (user_id);

CREATE POLICY "Users manage own settings" ON public.user_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());