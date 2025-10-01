-- Create visit_events table for audit trail
CREATE TABLE public.visit_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on visit_events
ALTER TABLE public.visit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visit_events
CREATE POLICY "Users can view visit events for accessible visits"
ON public.visit_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.visits v
    WHERE v.id = visit_events.visit_id
    AND (
      v.nurse_id = auth.uid()
      OR v.doctor_id = auth.uid()
      OR has_role(auth.uid(), 'control_room'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

CREATE POLICY "System can insert visit events"
ON public.visit_events
FOR INSERT
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_visit_events_visit_id ON public.visit_events(visit_id);
CREATE INDEX idx_visit_events_created_at ON public.visit_events(created_at);

-- Function to log visit status changes
CREATE OR REPLACE FUNCTION public.log_visit_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if status actually changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.visit_events (visit_id, event_type, event_data, created_by)
    VALUES (
      NEW.id,
      'status_change',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      auth.uid()
    );
  ELSIF (TG_OP = 'INSERT') THEN
    -- Log visit creation
    INSERT INTO public.visit_events (visit_id, event_type, event_data, created_by)
    VALUES (
      NEW.id,
      'visit_created',
      jsonb_build_object(
        'initial_status', NEW.status,
        'scheduled_start', NEW.scheduled_start,
        'scheduled_end', NEW.scheduled_end
      ),
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for logging visit events
CREATE TRIGGER trigger_log_visit_events
AFTER INSERT OR UPDATE ON public.visits
FOR EACH ROW
EXECUTE FUNCTION public.log_visit_status_change();