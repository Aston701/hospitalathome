-- Drop the old constraint
ALTER TABLE public.vitals_readings DROP CONSTRAINT IF EXISTS vitals_readings_type_check;

-- Add updated constraint with all vital types
ALTER TABLE public.vitals_readings
ADD CONSTRAINT vitals_readings_type_check
CHECK (type IN (
  'glucose',
  'bp_systolic',
  'bp_diastolic',
  'blood_pressure',
  'spo2',
  'oxygen_saturation',
  'heart_rate',
  'temp_c',
  'temperature',
  'respiratory_rate',
  'ecg_snapshot_url',
  'manual_note'
));