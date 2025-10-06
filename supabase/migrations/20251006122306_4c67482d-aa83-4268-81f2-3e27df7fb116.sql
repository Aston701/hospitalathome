-- Drop existing policies that are too permissive
DROP POLICY IF EXISTS "Doctors can view assigned patients" ON public.patients;
DROP POLICY IF EXISTS "Nurses can view assigned patients" ON public.patients;

-- Create stricter policies that only allow access to patients with active visits
-- Doctors can only view patients they have active or pending visits with (not cancelled or complete)
CREATE POLICY "Doctors can view patients with active visits"
ON public.patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM public.visits
    WHERE visits.patient_id = patients.id
      AND visits.doctor_id = auth.uid()
      AND visits.status NOT IN ('cancelled', 'complete')
  )
);

-- Nurses can only view patients they have active or pending visits with (not cancelled or complete)
CREATE POLICY "Nurses can view patients with active visits"
ON public.patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'nurse'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM public.visits
    WHERE visits.patient_id = patients.id
      AND visits.nurse_id = auth.uid()
      AND visits.status NOT IN ('cancelled', 'complete')
  )
);