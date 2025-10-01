-- Add RLS policies for telehealth_sessions table
-- These policies ensure only authorized users can access telehealth session data

-- Policy: Admins can view all telehealth sessions
CREATE POLICY "Admins can view all telehealth sessions"
ON public.telehealth_sessions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Control room can view all telehealth sessions
CREATE POLICY "Control room can view all telehealth sessions"
ON public.telehealth_sessions
FOR SELECT
USING (has_role(auth.uid(), 'control_room'::app_role));

-- Policy: Nurses can view sessions for their assigned visits
CREATE POLICY "Nurses can view their assigned telehealth sessions"
ON public.telehealth_sessions
FOR SELECT
USING (
  has_role(auth.uid(), 'nurse'::app_role) 
  AND EXISTS (
    SELECT 1 FROM visits 
    WHERE visits.id = telehealth_sessions.visit_id 
    AND visits.nurse_id = auth.uid()
  )
);

-- Policy: Doctors can view sessions for their assigned visits
CREATE POLICY "Doctors can view their assigned telehealth sessions"
ON public.telehealth_sessions
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM visits 
    WHERE visits.id = telehealth_sessions.visit_id 
    AND visits.doctor_id = auth.uid()
  )
);

-- Policy: Admins and control room can create telehealth sessions
CREATE POLICY "Admins and control room can create telehealth sessions"
ON public.telehealth_sessions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'control_room'::app_role)
);

-- Policy: Admins and control room can update telehealth sessions
CREATE POLICY "Admins and control room can update telehealth sessions"
ON public.telehealth_sessions
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'control_room'::app_role)
);

-- Policy: Nurses can update sessions for their assigned visits (to mark started/ended)
CREATE POLICY "Nurses can update their assigned telehealth sessions"
ON public.telehealth_sessions
FOR UPDATE
USING (
  has_role(auth.uid(), 'nurse'::app_role) 
  AND EXISTS (
    SELECT 1 FROM visits 
    WHERE visits.id = telehealth_sessions.visit_id 
    AND visits.nurse_id = auth.uid()
  )
);

-- Policy: Doctors can update sessions for their assigned visits
CREATE POLICY "Doctors can update their assigned telehealth sessions"
ON public.telehealth_sessions
FOR UPDATE
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM visits 
    WHERE visits.id = telehealth_sessions.visit_id 
    AND visits.doctor_id = auth.uid()
  )
);