-- Make prescriptions bucket private (this is safe to do)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'prescriptions';