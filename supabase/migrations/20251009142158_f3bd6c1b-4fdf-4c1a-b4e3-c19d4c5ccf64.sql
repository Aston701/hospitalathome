-- Create shifts table for rostering
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_end TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_type TEXT NOT NULL DEFAULT 'day', -- day, night, on-call
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);

-- Enable RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and control room can manage all shifts"
ON public.shifts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'control_room'));

CREATE POLICY "Users can view all shifts"
ON public.shifts
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own shifts"
ON public.shifts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_shifts_updated_at
BEFORE UPDATE ON public.shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_shifts_user_id ON public.shifts(user_id);
CREATE INDEX idx_shifts_dates ON public.shifts(shift_start, shift_end);