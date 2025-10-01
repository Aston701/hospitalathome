-- RLS policies for medical_boxes table
CREATE POLICY "Admins can manage medical boxes"
ON public.medical_boxes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Control room can manage medical boxes"
ON public.medical_boxes
FOR ALL
USING (has_role(auth.uid(), 'control_room'::app_role));

CREATE POLICY "Nurses can view medical boxes"
ON public.medical_boxes
FOR SELECT
USING (has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Doctors can view medical boxes"
ON public.medical_boxes
FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));