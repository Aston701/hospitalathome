-- Drop old tables and recreate with new structure
DROP TABLE IF EXISTS public.checklist_submissions CASCADE;
DROP TABLE IF EXISTS public.checklist_completions CASCADE;
DROP TABLE IF EXISTS public.checklist_items CASCADE;
DROP TABLE IF EXISTS public.checklist_templates CASCADE;

-- Create new checklist templates table
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create checklist submissions with new structure
CREATE TABLE public.checklist_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  staff_name TEXT NOT NULL,
  shift TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  signature_name TEXT NOT NULL,
  signature_timestamp TIMESTAMPTZ DEFAULT now(),
  pdf_url TEXT
);

-- Enable RLS
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view templates" 
ON public.checklist_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users view own submissions" 
ON public.checklist_submissions FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all submissions" 
ON public.checklist_submissions FOR SELECT TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'control_room'::app_role));

CREATE POLICY "Users insert own submissions" 
ON public.checklist_submissions FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Insert Start-of-Shift Checklist
INSERT INTO public.checklist_templates (name, description, order_index, sections) VALUES (
  'Start-of-Shift Equipment Checklist',
  'Check all equipment before starting shift',
  1,
  '[
    {
      "title": "Diagnostic Equipment",
      "items": [
        {"id": "ecg_module", "label": "ECG module", "type": "yesno"},
        {"id": "pulse_oximeter", "label": "Pulse oximeter", "type": "yesno"},
        {"id": "bp_device", "label": "Blood pressure (BP) device", "type": "yesno"},
        {"id": "thermometer", "label": "Thermometer", "type": "yesno"},
        {"id": "glucose_machine", "label": "Blood glucose machine", "type": "yesno"}
      ],
      "columns": ["Functional", "Comment"]
    },
    {
      "title": "Consumables",
      "items": [
        {"id": "ecg_dots", "label": "ECG dots – 20 dots (for 5 patients)", "type": "yesno"},
        {"id": "alcohol_swabs", "label": "Alcohol swabs", "type": "yesno"},
        {"id": "gloves", "label": "Gloves", "type": "yesno"},
        {"id": "bandages", "label": "Bandages", "type": "yesno"}
      ],
      "columns": ["Sufficient Quantity", "Comment"]
    }
  ]'::jsonb
);

-- Insert After-Each-Use Checklist
INSERT INTO public.checklist_templates (name, description, order_index, sections) VALUES (
  'After-Each-Use Cleaning & Reset Checklist',
  'Clean and reset equipment after each patient visit',
  2,
  '[
    {
      "title": "Disinfection",
      "items": [
        {"id": "devices_cleaned", "label": "All diagnostic devices cleaned with approved disinfectant", "type": "yesno"},
        {"id": "tablet_wiped", "label": "Tablet wiped down", "type": "yesno"},
        {"id": "surfaces_sanitized", "label": "Surfaces sanitized", "type": "yesno"}
      ],
      "columns": ["Status", "Comment"]
    },
    {
      "title": "Consumable Replacement",
      "items": [
        {"id": "consumables_restocked", "label": "Used consumables restocked", "type": "yesno"},
        {"id": "waste_disposed", "label": "Waste disposed of properly", "type": "yesno"}
      ],
      "columns": ["Status", "Comment"]
    },
    {
      "title": "Functional Check",
      "items": [
        {"id": "box_operational", "label": "Confirm box is operational", "type": "yesno"},
        {"id": "faults_damages", "label": "Note any faults or damages", "type": "comment"}
      ],
      "columns": ["Status", "Comment"]
    }
  ]'::jsonb
);

-- Insert End-of-Shift Checklist
INSERT INTO public.checklist_templates (name, description, order_index, sections) VALUES (
  'End-of-Shift Charging & Storage Checklist',
  'Check and charge equipment at end of shift',
  3,
  '[
    {
      "title": "Charging",
      "items": [
        {"id": "devices_charging", "label": "All devices placed on charge", "type": "yesno"},
        {"id": "charging_lights", "label": "Charging lights on", "type": "yesno"},
        {"id": "cables_undamaged", "label": "Power cables undamaged", "type": "yesno"}
      ],
      "columns": ["Status", "Comment"]
    },
    {
      "title": "Storage",
      "items": [
        {"id": "box_stored", "label": "Box stored in designated charging area", "type": "yesno"},
        {"id": "box_labeled", "label": "Box labeled correctly", "type": "yesno"},
        {"id": "battery_power", "label": "Box has sufficient battery power before storage", "type": "yesno"}
      ],
      "columns": ["Status", "Comment"]
    }
  ]'::jsonb
);