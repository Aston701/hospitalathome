-- Add transcription field to visits table
ALTER TABLE public.visits 
ADD COLUMN transcription TEXT;