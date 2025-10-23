-- Allow doctors to create patients
CREATE POLICY "Doctors can create patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) AND created_by = auth.uid()
);