-- Allow doctors to create vitals for their assigned visits
CREATE POLICY "Doctors can create vitals for assigned visits"
ON public.vitals_readings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM visits v
    WHERE v.id = vitals_readings.visit_id
      AND v.doctor_id = auth.uid()
  )
  AND has_role(auth.uid(), 'doctor'::app_role)
);