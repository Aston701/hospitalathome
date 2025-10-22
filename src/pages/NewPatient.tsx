import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { PatientForm } from "@/components/PatientForm";
import { z } from "zod";

const patientSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  phone: z.string().regex(/^[0-9+\-\s()]+$/, "Invalid phone number format").max(20),
  email: z.string().email("Invalid email format").max(255).optional().or(z.literal("")),
  sa_id_number: z.string().max(20).optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  address_line1: z.string().max(255).optional().or(z.literal("")),
  address_line2: z.string().max(255).optional().or(z.literal("")),
  suburb: z.string().max(100).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  province: z.string().max(100).optional().or(z.literal("")),
  postal_code: z.string().max(10).optional().or(z.literal("")),
  medical_aid_provider: z.string().max(100).optional().or(z.literal("")),
  medical_aid_number: z.string().max(50).optional().or(z.literal("")),
  medical_aid_plan: z.string().max(100).optional().or(z.literal("")),
  allergies: z.string().max(1000).optional().or(z.literal("")),
  conditions: z.string().max(1000).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  consent_signed: z.boolean()
});

const NewPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    setLoading(true);

    try {
      // Validate input
      const validatedData = patientSchema.parse(formData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("patients")
        .insert([{
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          phone: validatedData.phone,
          email: validatedData.email || null,
          sa_id_number: validatedData.sa_id_number || null,
          date_of_birth: validatedData.date_of_birth || null,
          address_line1: validatedData.address_line1 || null,
          address_line2: validatedData.address_line2 || null,
          suburb: validatedData.suburb || null,
          city: validatedData.city || null,
          province: validatedData.province || null,
          postal_code: validatedData.postal_code || null,
          medical_aid_provider: validatedData.medical_aid_provider || null,
          medical_aid_number: validatedData.medical_aid_number || null,
          medical_aid_plan: validatedData.medical_aid_plan || null,
          allergies: validatedData.allergies ? validatedData.allergies.split(",").map(a => a.trim()).filter(Boolean) : [],
          conditions: validatedData.conditions ? validatedData.conditions.split(",").map(c => c.trim()).filter(Boolean) : [],
          notes: validatedData.notes || null,
          consent_signed: validatedData.consent_signed,
          consent_timestamp: validatedData.consent_signed ? new Date().toISOString() : null,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Patient created",
        description: "Patient record has been successfully created."
      });

      navigate(`/patients/${data.id}`);
    } catch (error: any) {
      console.error("Patient creation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof z.ZodError 
          ? error.errors[0].message 
          : error.message || "Failed to create patient"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/patients")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Patient</h1>
          <p className="text-muted-foreground">Create a new patient record</p>
        </div>
      </div>

      <PatientForm
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => navigate("/patients")}
        submitLabel="Create Patient"
      />
    </div>
  );
};

export default NewPatient;