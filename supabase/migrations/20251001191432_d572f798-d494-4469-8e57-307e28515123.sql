-- Create storage bucket for visit photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-photos', 'visit-photos', false);

-- Create policies for visit photos bucket
CREATE POLICY "Nurses can upload photos for their visits"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'visit-photos' 
  AND auth.uid() IN (
    SELECT nurse_id FROM visits WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can view photos for accessible visits"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'visit-photos'
  AND (
    auth.uid() IN (
      SELECT nurse_id FROM visits WHERE id::text = (storage.foldername(name))[1]
    )
    OR auth.uid() IN (
      SELECT doctor_id FROM visits WHERE id::text = (storage.foldername(name))[1]
    )
    OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'control_room')
    )
  )
);