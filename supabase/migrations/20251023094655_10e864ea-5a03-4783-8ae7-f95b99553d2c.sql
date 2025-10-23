-- Clear all sample data while preserving users and audit logs
-- This prepares the system for production use

-- Delete in order to respect foreign key constraints

-- Clear visit-related data first
DELETE FROM public.vitals_readings;
DELETE FROM public.consultation_notes;
DELETE FROM public.prescriptions;
DELETE FROM public.sick_notes;
DELETE FROM public.diagnostic_requests;
DELETE FROM public.dispatch_events;
DELETE FROM public.visit_events;
DELETE FROM public.telehealth_sessions;

-- Clear visits
DELETE FROM public.visits;

-- Clear patients
DELETE FROM public.patients;

-- Clear requests and shifts
DELETE FROM public.requests;
DELETE FROM public.shifts;

-- Clear medical boxes
DELETE FROM public.medical_boxes;