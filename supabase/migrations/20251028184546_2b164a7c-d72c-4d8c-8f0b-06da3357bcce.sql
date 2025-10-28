-- Security Fix: Implement visit-based access control for storage
-- Drop overly permissive storage policies
DROP POLICY IF EXISTS "Authenticated users can view prescription PDFs" ON storage.objects;
DROP POLICY IF EXISTS "System can upload prescription PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view sick notes" ON storage.objects;

-- Create visit-based access control for prescriptions
-- Users can only view prescriptions if they're assigned to the visit (as nurse or doctor) or are admin/control_room
CREATE POLICY "Users can view prescriptions for assigned visits"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  (
    -- Extract prescription ID from filename (format: prescriptions/{uuid}.pdf)
    EXISTS (
      SELECT 1 FROM prescriptions p
      JOIN visits v ON p.visit_id = v.id
      WHERE p.id::text = (regexp_match(name, '([0-9a-f-]{36})'))[1]
      AND (
        v.nurse_id = auth.uid() OR
        v.doctor_id = auth.uid() OR
        has_role(auth.uid(), 'admin'::app_role) OR
        has_role(auth.uid(), 'control_room'::app_role)
      )
    )
    OR
    -- Sick notes (format: prescriptions/sick-notes/{uuid}.pdf)
    (
      (storage.foldername(name))[1] = 'sick-notes' AND
      EXISTS (
        SELECT 1 FROM sick_notes sn
        JOIN visits v ON sn.visit_id = v.id
        WHERE sn.id::text = (regexp_match(name, '([0-9a-f-]{36})'))[1]
        AND (
          v.nurse_id = auth.uid() OR
          v.doctor_id = auth.uid() OR
          has_role(auth.uid(), 'admin'::app_role) OR
          has_role(auth.uid(), 'control_room'::app_role)
        )
      )
    )
    OR
    -- Imaging requests (format: prescriptions/imaging-requests/{uuid}.pdf)
    (
      (storage.foldername(name))[1] = 'imaging-requests' AND
      EXISTS (
        SELECT 1 FROM diagnostic_requests dr
        JOIN visits v ON dr.visit_id = v.id
        WHERE dr.id::text = (regexp_match(name, '([0-9a-f-]{36})'))[1]
        AND (
          v.nurse_id = auth.uid() OR
          v.doctor_id = auth.uid() OR
          has_role(auth.uid(), 'admin'::app_role) OR
          has_role(auth.uid(), 'control_room'::app_role)
        )
      )
    )
  )
);

-- Only service role (edge functions) can upload files
CREATE POLICY "Service role can upload prescription files"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'prescriptions');

-- Allow authenticated users to delete their own visit photos
CREATE POLICY "Users can delete their own visit photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'visit-photos' AND
  auth.uid() IN (
    SELECT nurse_id FROM visits
    WHERE id::text = (storage.foldername(name))[1]
  )
);