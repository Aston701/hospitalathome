-- Create checklist templates table
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create checklist items table
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user checklist completions table
CREATE TABLE IF NOT EXISTS public.checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view templates" ON public.checklist_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view items" ON public.checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users view own completions" ON public.checklist_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own completions" ON public.checklist_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own completions" ON public.checklist_completions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Insert templates
INSERT INTO public.checklist_templates (name, description, order_index) 
SELECT * FROM (VALUES
  ('Start of Shift Equipment Checklist', 'Check all equipment before starting shift', 1),
  ('After Each Visit Cleaning and Reset Checklist', 'Clean and reset equipment after each patient visit', 2),
  ('End of Shift Equipment and Charging Checklist', 'Check and charge equipment at end of shift', 3)
) AS v(name, description, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.checklist_templates LIMIT 1);

-- Insert Start of Shift items
INSERT INTO public.checklist_items (template_id, item_text, order_index)
SELECT t.id, v.item, v.idx FROM public.checklist_templates t,
(VALUES
  ('Portable monitor (ECG, BP, SpO2)', 1), ('Pulse oximeter', 2), ('Thermometer', 3),
  ('Stethoscope', 4), ('Blood pressure cuff', 5), ('Glucometer and test strips', 6),
  ('IV supplies and medications', 7), ('Wound care supplies', 8), ('PPE (gloves, masks, gowns)', 9),
  ('Hand sanitizer', 10), ('Emergency medication kit', 11), ('Tablet/smartphone charged', 12),
  ('Medical bag fully stocked', 13)
) AS v(item, idx)
WHERE t.name = 'Start of Shift Equipment Checklist'
AND NOT EXISTS (SELECT 1 FROM public.checklist_items WHERE template_id = t.id);

-- Insert After Visit items
INSERT INTO public.checklist_items (template_id, item_text, order_index)
SELECT t.id, v.item, v.idx FROM public.checklist_templates t,
(VALUES
  ('Disinfect portable monitor', 1), ('Clean and disinfect stethoscope', 2), ('Disinfect BP cuff', 3),
  ('Clean thermometer', 4), ('Dispose of used PPE properly', 5), ('Restock used supplies', 6),
  ('Check and replenish medications', 7), ('Sanitize hands', 8), ('Update patient records', 9),
  ('Organize medical bag', 10)
) AS v(item, idx)
WHERE t.name = 'After Each Visit Cleaning and Reset Checklist'
AND NOT EXISTS (SELECT 1 FROM public.checklist_items WHERE template_id = t.id);

-- Insert End of Shift items
INSERT INTO public.checklist_items (template_id, item_text, order_index)
SELECT t.id, v.item, v.idx FROM public.checklist_templates t,
(VALUES
  ('Charge portable monitor', 1), ('Charge tablet/smartphone', 2), ('Restock all used supplies', 3),
  ('Refill PPE stock', 4), ('Check expiration dates on medications', 5), ('Clean and organize medical bag', 6),
  ('Report any equipment malfunctions', 7), ('Complete all documentation', 8), ('Notify next shift of any issues', 9),
  ('Store equipment in designated area', 10)
) AS v(item, idx)
WHERE t.name = 'End of Shift Equipment and Charging Checklist'
AND NOT EXISTS (SELECT 1 FROM public.checklist_items WHERE template_id = t.id);