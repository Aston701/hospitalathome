-- Update RLS policies for visits table to implement proper access control

-- Drop existing policies
DROP POLICY IF EXISTS "Control room can manage visits" ON public.visits;
DROP POLICY IF EXISTS "Nurses can update assigned visits" ON public.visits;
DROP POLICY IF EXISTS "Users can view visits" ON public.visits;

-- Nurses can only view their assigned visits
CREATE POLICY "Nurses can view assigned visits" ON public.visits
FOR SELECT 
USING (
  has_role(auth.uid(), 'nurse') AND nurse_id = auth.uid()
);

-- Nurses can only update their assigned visits
CREATE POLICY "Nurses can update assigned visits" ON public.visits
FOR UPDATE 
USING (
  has_role(auth.uid(), 'nurse') AND nurse_id = auth.uid()
);

-- Doctors can view all visits
CREATE POLICY "Doctors can view all visits" ON public.visits
FOR SELECT 
USING (
  has_role(auth.uid(), 'doctor')
);

-- Admins can do everything with visits
CREATE POLICY "Admins can manage all visits" ON public.visits
FOR ALL 
USING (
  has_role(auth.uid(), 'admin')
);

-- Control room can manage all visits
CREATE POLICY "Control room can manage all visits" ON public.visits
FOR ALL 
USING (
  has_role(auth.uid(), 'control_room')
);

-- Update RLS policies for patients table

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Control room can create patients" ON public.patients;
DROP POLICY IF EXISTS "Control room can update patients" ON public.patients;

-- Nurses can only view patients they have visits with
CREATE POLICY "Nurses can view their patients" ON public.patients
FOR SELECT 
USING (
  has_role(auth.uid(), 'nurse') AND 
  EXISTS (
    SELECT 1 FROM visits 
    WHERE visits.patient_id = patients.id 
    AND visits.nurse_id = auth.uid()
  )
);

-- Doctors, admins, and control room can view all patients
CREATE POLICY "Doctors can view all patients" ON public.patients
FOR SELECT 
USING (
  has_role(auth.uid(), 'doctor') OR 
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'control_room')
);

-- Only admins and control room can create/update patients
CREATE POLICY "Admins can manage patients" ON public.patients
FOR ALL 
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'control_room')
);

-- Update profiles RLS to prevent role changes by regular users
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT 
USING (auth.uid() = id);

-- Users can only update their own non-role fields
CREATE POLICY "Users can update own profile details" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Ensure role hasn't changed
  role = (SELECT role FROM profiles WHERE id = auth.uid())
);