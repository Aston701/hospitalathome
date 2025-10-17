-- Add status and signature fields to sick_notes table

-- Add status field (similar to prescriptions)
ALTER TABLE sick_notes 
ADD COLUMN status text NOT NULL DEFAULT 'draft',
ADD COLUMN signature_timestamp timestamp with time zone,
ADD COLUMN signature_name text,
ADD COLUMN signature_ip text;

-- Add check constraint for valid status values
ALTER TABLE sick_notes
ADD CONSTRAINT sick_notes_status_check 
CHECK (status IN ('draft', 'signed'));

-- Update RLS policies for sick notes

-- Drop old policies
DROP POLICY IF EXISTS "Doctors and nurses can create sick notes for assigned visits" ON sick_notes;
DROP POLICY IF EXISTS "Users can view sick notes for accessible visits" ON sick_notes;
DROP POLICY IF EXISTS "Admins and control room can manage sick notes" ON sick_notes;

-- Nurses can create draft sick notes for their assigned visits
CREATE POLICY "Nurses can create draft sick notes for assigned visits"
ON sick_notes
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'nurse'::app_role) AND
  EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = sick_notes.visit_id
    AND v.nurse_id = auth.uid()
  ) AND
  issued_by = auth.uid() AND
  status = 'draft'
);

-- Doctors can create and sign sick notes for any visit they can access
CREATE POLICY "Doctors can create sick notes for assigned visits"
ON sick_notes
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) AND
  EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = sick_notes.visit_id
    AND v.doctor_id = auth.uid()
  ) AND
  issued_by = auth.uid()
);

-- Doctors can update (sign) sick notes for their assigned visits
CREATE POLICY "Doctors can sign sick notes for assigned visits"
ON sick_notes
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND
  EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = sick_notes.visit_id
    AND v.doctor_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) AND
  EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = sick_notes.visit_id
    AND v.doctor_id = auth.uid()
  )
);

-- Nurses can update draft sick notes they created
CREATE POLICY "Nurses can update draft sick notes for assigned visits"
ON sick_notes
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'nurse'::app_role) AND
  EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = sick_notes.visit_id
    AND v.nurse_id = auth.uid()
  ) AND
  status = 'draft' AND
  issued_by = auth.uid()
)
WITH CHECK (
  status = 'draft'
);

-- Users can view sick notes for accessible visits
CREATE POLICY "Users can view sick notes for accessible visits"
ON sick_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = sick_notes.visit_id
    AND (
      v.nurse_id = auth.uid() OR
      v.doctor_id = auth.uid() OR
      has_role(auth.uid(), 'control_room'::app_role) OR
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- Admins and control room can manage all sick notes
CREATE POLICY "Admins and control room can manage sick notes"
ON sick_notes
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