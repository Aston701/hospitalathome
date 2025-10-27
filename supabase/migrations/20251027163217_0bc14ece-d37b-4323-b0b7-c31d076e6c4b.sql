-- Create system settings table for global configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zapier_webhook_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT single_row_check CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read system settings
CREATE POLICY "Authenticated users can view system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can update system settings
CREATE POLICY "Admins can update system settings"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert system settings
CREATE POLICY "Admins can insert system settings"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial row with the existing webhook URL
INSERT INTO public.system_settings (id, zapier_webhook_url)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  (SELECT zapier_webhook_url FROM profiles WHERE zapier_webhook_url IS NOT NULL LIMIT 1)
);

-- Remove zapier_webhook_url column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS zapier_webhook_url;