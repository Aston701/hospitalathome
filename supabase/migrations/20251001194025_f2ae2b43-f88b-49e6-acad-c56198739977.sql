-- Allow admins and control room to create vitals for any visit
CREATE POLICY "Admins and control room can create vitals for any visit"
ON public.vitals_readings
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'control_room'::app_role)
);