-- Create storage policies for sick notes in the prescriptions bucket

-- Allow authenticated users to upload sick notes
CREATE POLICY "Authenticated users can upload sick notes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = 'sick-notes'
);

-- Allow authenticated users to read sick notes
CREATE POLICY "Authenticated users can view sick notes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = 'sick-notes'
);

-- Allow service role to manage sick notes (for edge function)
CREATE POLICY "Service role can manage sick notes"
ON storage.objects
FOR ALL
TO service_role
USING (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = 'sick-notes'
)
WITH CHECK (
  bucket_id = 'prescriptions' AND
  (storage.foldername(name))[1] = 'sick-notes'
);