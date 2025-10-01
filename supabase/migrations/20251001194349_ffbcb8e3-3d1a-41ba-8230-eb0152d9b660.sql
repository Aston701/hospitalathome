-- Allow admins and control room to upload photos to visit-photos bucket
CREATE POLICY "Admins can upload visit photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'visit-photos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Control room can upload visit photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'visit-photos' AND
  has_role(auth.uid(), 'control_room'::app_role)
);

-- Allow admins and control room to view visit photos
CREATE POLICY "Admins can view visit photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'visit-photos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Control room can view visit photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'visit-photos' AND
  has_role(auth.uid(), 'control_room'::app_role)
);