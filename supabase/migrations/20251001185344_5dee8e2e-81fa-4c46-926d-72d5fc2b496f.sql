-- Fix patient privacy: Restrict doctor access to only assigned patients

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Doctors can view all patients" ON public.patients;

-- Create new policy: Doctors can only view patients they're assigned to
CREATE POLICY "Doctors can view assigned patients only"
ON public.patients
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.visits
    WHERE visits.patient_id = patients.id
    AND visits.doctor_id = auth.uid()
  )
);

-- Keep admin and control room access for operational needs (separate policy for clarity)
CREATE POLICY "Admin and control room can view all patients"
ON public.patients
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'control_room'::app_role)
);