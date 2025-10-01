-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('control_room', 'nurse', 'doctor', 'admin');

-- Create visit status enum
CREATE TYPE public.visit_status AS ENUM (
  'scheduled',
  'assigned',
  'en_route',
  'on_site',
  'in_telemed',
  'complete',
  'cancelled',
  'no_show'
);

-- Create priority enum
CREATE TYPE public.priority_level AS ENUM ('routine', 'urgent', 'emergency');

-- Create request status enum  
CREATE TYPE public.request_status AS ENUM ('new', 'converted', 'cancelled');

-- Create prescription status enum
CREATE TYPE public.prescription_status AS ENUM ('draft', 'signed', 'sent_to_patient', 'sent_to_pharmacy');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  full_name TEXT NOT NULL,
  phone TEXT,
  role app_role NOT NULL DEFAULT 'control_room',
  is_active BOOLEAN NOT NULL DEFAULT true,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table for RBAC
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  sa_id_number TEXT,
  date_of_birth DATE,
  phone TEXT NOT NULL,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  suburb TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  geo_lat NUMERIC(10, 8),
  geo_lng NUMERIC(11, 8),
  medical_aid_provider TEXT,
  medical_aid_number TEXT,
  medical_aid_plan TEXT,
  allergies TEXT[],
  conditions TEXT[],
  notes TEXT,
  consent_signed BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  privacy_preferences JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create requests table (intake)
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  created_by_user_id UUID REFERENCES public.profiles(id),
  source TEXT CHECK (source IN ('phone', 'web', 'email')),
  reason_for_visit TEXT NOT NULL,
  priority priority_level NOT NULL DEFAULT 'routine',
  status request_status NOT NULL DEFAULT 'new',
  linked_patient_id UUID REFERENCES public.patients(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create medical_boxes table (device kits)
CREATE TABLE public.medical_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  label TEXT NOT NULL,
  tablet_serial TEXT,
  status TEXT CHECK (status IN ('in_service', 'maintenance')) DEFAULT 'in_service',
  assigned_to_user_id UUID REFERENCES public.profiles(id),
  components JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create visits table (appointments)
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status visit_status NOT NULL DEFAULT 'scheduled',
  nurse_id UUID REFERENCES public.profiles(id),
  doctor_id UUID REFERENCES public.profiles(id),
  medical_box_id UUID REFERENCES public.medical_boxes(id),
  dispatch_reference TEXT,
  location_snapshot JSONB DEFAULT '{}'::jsonb,
  checklist JSONB DEFAULT '[]'::jsonb,
  billing_codes TEXT[],
  outcome TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vitals_readings table
CREATE TABLE public.vitals_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN (
    'glucose', 'bp_systolic', 'bp_diastolic', 'spo2', 
    'heart_rate', 'temp_c', 'ecg_snapshot_url', 'manual_note'
  )),
  value_number NUMERIC,
  unit TEXT,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  captured_by_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create telehealth_sessions table
CREATE TABLE public.telehealth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  teams_meeting_id TEXT,
  join_url TEXT,
  recording_enabled BOOLEAN NOT NULL DEFAULT false,
  transcription_enabled BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  artifacts JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  pdf_url TEXT,
  status prescription_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dispatch_events table
CREATE TABLE public.dispatch_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'assigned', 'nurse_en_route', 'nurse_arrived', 'nurse_departed'
  )),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gps_lat NUMERIC(10, 8),
  gps_lng NUMERIC(11, 8),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create audit_log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  before_data JSONB,
  after_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_patients_org_id ON public.patients(org_id);
CREATE INDEX idx_patients_search ON public.patients USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(phone, '')));
CREATE INDEX idx_visits_patient_id ON public.visits(patient_id);
CREATE INDEX idx_visits_nurse_id ON public.visits(nurse_id);
CREATE INDEX idx_visits_status ON public.visits(status);
CREATE INDEX idx_visits_scheduled_start ON public.visits(scheduled_start);
CREATE INDEX idx_vitals_visit_id ON public.vitals_readings(visit_id);
CREATE INDEX idx_dispatch_events_visit_id ON public.dispatch_events(visit_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_timestamp ON public.audit_log(timestamp DESC);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telehealth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
  ON public.profiles FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for patients
CREATE POLICY "Authenticated users can view patients" 
  ON public.patients FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Control room can create patients" 
  ON public.patients FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'control_room') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Control room can update patients" 
  ON public.patients FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'control_room') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- Create RLS policies for visits
CREATE POLICY "Users can view visits" 
  ON public.visits FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND (
      nurse_id = auth.uid() OR
      doctor_id = auth.uid() OR
      created_by = auth.uid() OR
      public.has_role(auth.uid(), 'control_room') OR
      public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Control room can manage visits" 
  ON public.visits FOR ALL 
  USING (
    public.has_role(auth.uid(), 'control_room') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Nurses can update assigned visits" 
  ON public.visits FOR UPDATE 
  USING (
    nurse_id = auth.uid() AND 
    public.has_role(auth.uid(), 'nurse')
  );

-- Create RLS policies for vitals
CREATE POLICY "Users can view vitals for accessible visits" 
  ON public.vitals_readings FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.visits v
      WHERE v.id = visit_id AND (
        v.nurse_id = auth.uid() OR
        v.doctor_id = auth.uid() OR
        public.has_role(auth.uid(), 'control_room') OR
        public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Nurses can create vitals for assigned visits" 
  ON public.vitals_readings FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.visits v
      WHERE v.id = visit_id AND v.nurse_id = auth.uid()
    ) AND public.has_role(auth.uid(), 'nurse')
  );

-- Create RLS policies for prescriptions
CREATE POLICY "Users can view prescriptions for accessible visits" 
  ON public.prescriptions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.visits v
      WHERE v.id = visit_id AND (
        v.nurse_id = auth.uid() OR
        v.doctor_id = auth.uid() OR
        public.has_role(auth.uid(), 'control_room') OR
        public.has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Doctors can create prescriptions" 
  ON public.prescriptions FOR INSERT 
  WITH CHECK (
    doctor_id = auth.uid() AND
    public.has_role(auth.uid(), 'doctor')
  );

CREATE POLICY "Doctors can update own prescriptions" 
  ON public.prescriptions FOR UPDATE 
  USING (
    doctor_id = auth.uid() AND
    public.has_role(auth.uid(), 'doctor')
  );

-- Create RLS policies for audit log (read-only for admins)
CREATE POLICY "Admins can view audit log" 
  ON public.audit_log FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit log" 
  ON public.audit_log FOR INSERT 
  WITH CHECK (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_boxes_updated_at BEFORE UPDATE ON public.medical_boxes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telehealth_sessions_updated_at BEFORE UPDATE ON public.telehealth_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'control_room')
  );
  
  -- Add default role to user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'control_room')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();