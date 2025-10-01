-- CRITICAL SECURITY FIX: Restrict patients table access to authenticated users only
-- Drop existing policies that apply to PUBLIC role
DROP POLICY IF EXISTS "Nurses can view their patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can manage patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view assigned patients only" ON public.patients;
DROP POLICY IF EXISTS "Admin and control room can view all patients" ON public.patients;

-- Recreate policies with TO authenticated restriction
-- This ensures ONLY authenticated users can access patient data

-- Admins and control room can manage all patient records
CREATE POLICY "Admins can manage patients"
ON public.patients
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'control_room'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'control_room'::app_role)
);

-- Nurses can only view patients assigned to them via visits
CREATE POLICY "Nurses can view assigned patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'nurse'::app_role) AND 
  EXISTS (
    SELECT 1
    FROM visits
    WHERE visits.patient_id = patients.id 
      AND visits.nurse_id = auth.uid()
  )
);

-- Doctors can only view patients assigned to them via visits
CREATE POLICY "Doctors can view assigned patients"
ON public.patients
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND 
  EXISTS (
    SELECT 1
    FROM visits
    WHERE visits.patient_id = patients.id 
      AND visits.doctor_id = auth.uid()
  )
);