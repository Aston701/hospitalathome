-- Add SELECT policy for sick notes so users can view them
CREATE POLICY "Users can view sick notes for assigned visits"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions'
  AND (storage.foldername(name))[1] = 'sick-notes'
  AND EXISTS (
    SELECT 1 FROM sick_notes sn
    JOIN visits v ON sn.visit_id = v.id
    WHERE sn.id::text = (regexp_match(name, '([0-9a-f-]{36})'))[1]
    AND (
      v.nurse_id = auth.uid() 
      OR v.doctor_id = auth.uid() 
      OR v.patient_id IN (SELECT id FROM patients WHERE id = sn.patient_id)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'control_room'::app_role)
    )
  )
);