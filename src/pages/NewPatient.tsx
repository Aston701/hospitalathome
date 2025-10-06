import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { PatientForm } from "@/components/PatientForm";

const NewPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("patients")
        .insert([{
          ...formData,
          allergies: formData.allergies ? formData.allergies.split(",").map(a => a.trim()) : [],
          conditions: formData.conditions ? formData.conditions.split(",").map(c => c.trim()) : [],
          consent_timestamp: formData.consent_signed ? new Date().toISOString() : null,
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
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
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