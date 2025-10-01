-- Add RLS policies for user_roles table

-- Policy: Admins can manage all user roles
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can insert roles (for handle_new_user trigger)
CREATE POLICY "System can insert roles for new users"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);