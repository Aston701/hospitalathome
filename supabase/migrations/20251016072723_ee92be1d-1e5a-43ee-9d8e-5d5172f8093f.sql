-- Create table for diagnostic test requests
CREATE TABLE public.diagnostic_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  tests_requested JSONB NOT NULL DEFAULT '[]'::jsonb,
  clinical_notes TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for sick notes
CREATE TABLE public.sick_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  diagnosis TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_duration INTEGER NOT NULL,
  additional_notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diagnostic_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sick_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for diagnostic_requests
CREATE POLICY "Admins and control room can manage diagnostic requests"
ON public.diagnostic_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'control_room'::app_role));

CREATE POLICY "Doctors and nurses can create diagnostic requests for assigned visits"
ON public.diagnostic_requests
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'nurse'::app_role))
  AND EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = diagnostic_requests.visit_id
    AND (v.doctor_id = auth.uid() OR v.nurse_id = auth.uid())
  )
  AND requested_by = auth.uid()
);

CREATE POLICY "Users can view diagnostic requests for accessible visits"
ON public.diagnostic_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = diagnostic_requests.visit_id
    AND (
      v.nurse_id = auth.uid()
      OR v.doctor_id = auth.uid()
      OR has_role(auth.uid(), 'control_room'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- RLS policies for sick_notes
CREATE POLICY "Admins and control room can manage sick notes"
ON public.sick_notes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'control_room'::app_role));

CREATE POLICY "Doctors and nurses can create sick notes for assigned visits"
ON public.sick_notes
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'nurse'::app_role))
  AND EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = sick_notes.visit_id
    AND (v.doctor_id = auth.uid() OR v.nurse_id = auth.uid())
  )
  AND issued_by = auth.uid()
);

CREATE POLICY "Users can view sick notes for accessible visits"
ON public.sick_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = sick_notes.visit_id
    AND (
      v.nurse_id = auth.uid()
      OR v.doctor_id = auth.uid()
      OR has_role(auth.uid(), 'control_room'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_diagnostic_requests_updated_at
BEFORE UPDATE ON public.diagnostic_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sick_notes_updated_at
BEFORE UPDATE ON public.sick_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();