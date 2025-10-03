-- Add Teams meeting URL to visits table
ALTER TABLE public.visits
ADD COLUMN teams_meeting_url TEXT;