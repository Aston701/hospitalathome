-- Enable RLS on dispatch_events table
ALTER TABLE public.dispatch_events ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all dispatch events
CREATE POLICY "Admins can manage all dispatch events"
ON public.dispatch_events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Control room can manage all dispatch events
CREATE POLICY "Control room can manage all dispatch events"
ON public.dispatch_events
FOR ALL
USING (has_role(auth.uid(), 'control_room'::app_role));

-- Policy: Doctors can view dispatch events for their assigned visits
CREATE POLICY "Doctors can view dispatch events for assigned visits"
ON public.dispatch_events
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = dispatch_events.visit_id
    AND visits.doctor_id = auth.uid()
  )
);

-- Policy: Nurses can view dispatch events for their assigned visits
CREATE POLICY "Nurses can view dispatch events for assigned visits"
ON public.dispatch_events
FOR SELECT
USING (
  has_role(auth.uid(), 'nurse'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = dispatch_events.visit_id
    AND visits.nurse_id = auth.uid()
  )
);

-- Policy: Nurses can create dispatch events for their assigned visits
CREATE POLICY "Nurses can create dispatch events for assigned visits"
ON public.dispatch_events
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'nurse'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.id = dispatch_events.visit_id
    AND visits.nurse_id = auth.uid()
  )
  AND created_by = auth.uid()
);