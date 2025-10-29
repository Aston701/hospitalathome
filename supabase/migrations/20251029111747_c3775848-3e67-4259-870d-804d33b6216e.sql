-- Fix: Remove conflicting storage policy for sick notes
-- The "Authenticated users can upload sick notes" policy conflicts with service_role-only policy

DROP POLICY IF EXISTS "Authenticated users can upload sick notes" ON storage.objects;