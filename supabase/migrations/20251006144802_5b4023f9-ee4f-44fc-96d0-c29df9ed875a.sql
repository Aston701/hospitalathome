-- Allow admins and control room to manage prescriptions
CREATE POLICY "Admins and control room can manage prescriptions"
ON public.prescriptions
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'control_room'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'control_room'::app_role)
);

-- Create storage bucket for prescription PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prescriptions',
  'prescriptions',
  false,
  5242880, -- 5MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for prescription PDFs
CREATE POLICY "Authenticated users can view prescription PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'prescriptions');

CREATE POLICY "System can upload prescription PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'prescriptions');