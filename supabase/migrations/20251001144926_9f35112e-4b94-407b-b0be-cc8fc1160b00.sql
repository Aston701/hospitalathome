-- Fix the check_medical_box_availability function to use correct enum value
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
        AND status NOT IN ('cancelled', 'complete')
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