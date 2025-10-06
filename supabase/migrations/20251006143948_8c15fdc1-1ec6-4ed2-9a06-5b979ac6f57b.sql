-- Allow nurses to create and update draft prescriptions for their assigned visits
CREATE POLICY "Nurses can create prescriptions for assigned visits"
ON public.prescriptions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'nurse'::app_role) 
  AND EXISTS (
    SELECT 1 FROM visits v 
    WHERE v.id = visit_id 
    AND v.nurse_id = auth.uid()
  )
  AND status = 'draft'::prescription_status
);

CREATE POLICY "Nurses can update draft prescriptions for assigned visits"
ON public.prescriptions
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'nurse'::app_role) 
  AND EXISTS (
    SELECT 1 FROM visits v 
    WHERE v.id = visit_id 
    AND v.nurse_id = auth.uid()
  )
  AND status = 'draft'::prescription_status
)
WITH CHECK (
  status = 'draft'::prescription_status
);