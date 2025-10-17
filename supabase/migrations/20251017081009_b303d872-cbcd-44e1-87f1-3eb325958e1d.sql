-- Make the prescriptions bucket public so PDFs can be accessed directly
UPDATE storage.buckets 
SET public = true 
WHERE name = 'prescriptions';