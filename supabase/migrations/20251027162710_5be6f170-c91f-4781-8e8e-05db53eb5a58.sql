-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Users can update own profile details" ON profiles;

-- Create a new update policy that allows users to update their own profile including zapier_webhook_url
CREATE POLICY "Users can update own profile details"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- Ensure the select policy allows reading zapier_webhook_url
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);