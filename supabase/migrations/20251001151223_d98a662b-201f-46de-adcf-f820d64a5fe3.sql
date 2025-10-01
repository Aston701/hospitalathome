-- Enable RLS on requests table
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and control room can manage all requests
CREATE POLICY "Admins and control room can manage all requests"
ON public.requests
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'control_room'::app_role)
);

-- Policy: Users can view requests they created
CREATE POLICY "Users can view their own requests"
ON public.requests
FOR SELECT
USING (created_by_user_id = auth.uid());

-- Policy: Doctors can view all requests (for triage and scheduling)
CREATE POLICY "Doctors can view all requests"
ON public.requests
FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));

-- Policy: Nurses can view all requests (for coordination)
CREATE POLICY "Nurses can view all requests"
ON public.requests
FOR SELECT
USING (has_role(auth.uid(), 'nurse'::app_role));

-- Policy: Authenticated users can create requests
CREATE POLICY "Authenticated users can create requests"
ON public.requests
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by_user_id = auth.uid()
);