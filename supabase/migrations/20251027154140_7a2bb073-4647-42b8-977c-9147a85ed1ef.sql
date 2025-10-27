-- Make shift column nullable in checklist_submissions
ALTER TABLE checklist_submissions ALTER COLUMN shift DROP NOT NULL;