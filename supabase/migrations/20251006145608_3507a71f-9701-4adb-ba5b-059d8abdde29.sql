-- Add signature fields to prescriptions table
ALTER TABLE public.prescriptions
ADD COLUMN signature_name TEXT,
ADD COLUMN signature_ip TEXT,
ADD COLUMN signature_timestamp TIMESTAMP WITH TIME ZONE;