-- Insert 10 medical boxes
INSERT INTO public.medical_boxes (label, status) VALUES
  ('Medical Box 001', 'in_service'),
  ('Medical Box 002', 'in_service'),
  ('Medical Box 003', 'in_service'),
  ('Medical Box 004', 'in_service'),
  ('Medical Box 005', 'in_service'),
  ('Medical Box 006', 'in_service'),
  ('Medical Box 007', 'in_service'),
  ('Medical Box 008', 'in_service'),
  ('Medical Box 009', 'in_service'),
  ('Medical Box 010', 'in_service');

-- Function to check if medical box is available for the time slot
CREATE OR REPLACE FUNCTION public.check_medical_box_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only check if a medical box is assigned
  IF NEW.medical_box_id IS NOT NULL THEN
    -- Check for overlapping visits with the same medical box
    IF EXISTS (
      SELECT 1
      FROM public.visits
      WHERE medical_box_id = NEW.medical_box_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status NOT IN ('cancelled', 'completed')
        AND (
          (NEW.scheduled_start >= scheduled_start AND NEW.scheduled_start < scheduled_end)
          OR (NEW.scheduled_end > scheduled_start AND NEW.scheduled_end <= scheduled_end)
          OR (NEW.scheduled_start <= scheduled_start AND NEW.scheduled_end >= scheduled_end)
        )
    ) THEN
      RAISE EXCEPTION 'Medical box is already assigned to another visit during this time slot';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate medical box availability
DROP TRIGGER IF EXISTS validate_medical_box_availability ON public.visits;
CREATE TRIGGER validate_medical_box_availability
  BEFORE INSERT OR UPDATE ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION public.check_medical_box_availability();