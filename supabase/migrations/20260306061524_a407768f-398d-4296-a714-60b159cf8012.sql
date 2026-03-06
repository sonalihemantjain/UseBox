
-- Allow users to insert steps for their own paths
CREATE POLICY "Users insert steps for own paths" ON public.learning_path_steps
  FOR INSERT TO authenticated
  WITH CHECK (path_id IN (SELECT id FROM public.learning_paths WHERE user_id = auth.uid()));
