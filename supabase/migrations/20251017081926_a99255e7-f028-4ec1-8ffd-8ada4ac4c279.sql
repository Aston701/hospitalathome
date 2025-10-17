-- Create consultation notes table
CREATE TABLE consultation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Clinical Information
  chief_complaint TEXT,
  history_present_illness TEXT,
  past_medical_history TEXT,
  current_medications TEXT,
  physical_examination TEXT,
  vital_signs_notes TEXT,
  assessment TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  prescriptions_notes TEXT,
  follow_up_instructions TEXT,
  additional_notes TEXT,
  
  -- Meta
  note_type TEXT NOT NULL DEFAULT 'consultation' CHECK (note_type IN ('consultation', 'progress', 'discharge'))
);

-- Enable RLS
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Doctors and nurses can create notes for assigned visits"
ON consultation_notes
FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'nurse'::app_role)) AND
  EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = consultation_notes.visit_id
    AND (v.doctor_id = auth.uid() OR v.nurse_id = auth.uid())
  ) AND
  created_by = auth.uid()
);

CREATE POLICY "Doctors and nurses can update their own notes"
ON consultation_notes
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() AND
  (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'nurse'::app_role))
);

CREATE POLICY "Users can view notes for accessible visits"
ON consultation_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM visits v
    WHERE v.id = consultation_notes.visit_id
    AND (
      v.nurse_id = auth.uid() OR
      v.doctor_id = auth.uid() OR
      has_role(auth.uid(), 'control_room'::app_role) OR
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

CREATE POLICY "Admins and control room can manage all notes"
ON consultation_notes
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'control_room'::app_role)
);

-- Add trigger for updated_at
CREATE TRIGGER update_consultation_notes_updated_at
BEFORE UPDATE ON consultation_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();