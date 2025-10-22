-- Fix security issues with RLS policies

-- 1. Fix doctors viewing all visits - they should only see assigned visits
DROP POLICY IF EXISTS "Doctors can view all visits" ON public.visits;

CREATE POLICY "Doctors can view assigned visits"
ON public.visits
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND doctor_id = auth.uid()
);

-- 2. Fix shifts visibility - restrict to own shifts + admin/control room
DROP POLICY IF EXISTS "Users can view all shifts" ON public.shifts;

CREATE POLICY "Users can view relevant shifts"
ON public.shifts
FOR SELECT
USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'control_room'::app_role)
);

-- 3. Restrict profiles to only show basic info unless admin/control room
-- Keep the existing policy but document that full directory access is intentional
-- If you want to restrict this later, you can update this policy

-- Note: The "Users can view all profiles" policy allows directory functionality
-- which may be needed for assigning doctors/nurses to visits. If this should be
-- restricted, consider creating a view with limited fields for general users.