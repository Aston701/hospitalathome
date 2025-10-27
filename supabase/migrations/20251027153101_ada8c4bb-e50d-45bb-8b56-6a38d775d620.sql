-- Create checklist submissions table to track when each checklist is completed
CREATE TABLE IF NOT EXISTS public.checklist_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  completed_items JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.checklist_submissions ENABLE ROW LEVEL SECURITY;

-- Nurses can view their own submissions
CREATE POLICY "Users view own submissions"
ON public.checklist_submissions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins and control room can view all submissions
CREATE POLICY "Admins view all submissions"
ON public.checklist_submissions FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'control_room'::app_role));

-- Nurses can insert their own submissions
CREATE POLICY "Users insert own submissions"
ON public.checklist_submissions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);