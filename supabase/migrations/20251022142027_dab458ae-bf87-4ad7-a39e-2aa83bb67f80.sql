-- Allow doctors to create visits
CREATE POLICY "Doctors can create visits" 
ON public.visits 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) AND
  created_by = auth.uid()
);