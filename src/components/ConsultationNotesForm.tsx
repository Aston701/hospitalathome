import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConsultationNotesFormProps {
  visitId: string;
  onSuccess?: () => void;
}

export function ConsultationNotesForm({ visitId, onSuccess }: ConsultationNotesFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    note_type: "consultation",
    chief_complaint: "",
    history_present_illness: "",
    past_medical_history: "",
    current_medications: "",
    physical_examination: "",
    vital_signs_notes: "",
    assessment: "",
    diagnosis: "",
    treatment_plan: "",
    prescriptions_notes: "",
    follow_up_instructions: "",
    additional_notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("consultation_notes")
        .insert({
          visit_id: visitId,
          created_by: user.id,
          ...formData,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Consultation notes saved successfully",
      });

      // Reset form
      setFormData({
        note_type: "consultation",
        chief_complaint: "",
        history_present_illness: "",
        past_medical_history: "",
        current_medications: "",
        physical_examination: "",
        vital_signs_notes: "",
        assessment: "",
        diagnosis: "",
        treatment_plan: "",
        prescriptions_notes: "",
        follow_up_instructions: "",
        additional_notes: "",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving consultation notes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save consultation notes",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultation Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="note_type">Note Type</Label>
            <Select
              value={formData.note_type}
              onValueChange={(value) => setFormData({ ...formData, note_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="progress">Progress Note</SelectItem>
                <SelectItem value="discharge">Discharge Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="chief_complaint">Chief Complaint</Label>
              <Textarea
                id="chief_complaint"
                value={formData.chief_complaint}
                onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                placeholder="Patient's main concern or reason for visit"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="history_present_illness">History of Present Illness</Label>
              <Textarea
                id="history_present_illness"
                value={formData.history_present_illness}
                onChange={(e) => setFormData({ ...formData, history_present_illness: e.target.value })}
                placeholder="Details about the current illness"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="past_medical_history">Past Medical History</Label>
              <Textarea
                id="past_medical_history"
                value={formData.past_medical_history}
                onChange={(e) => setFormData({ ...formData, past_medical_history: e.target.value })}
                placeholder="Previous illnesses, surgeries, chronic conditions"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_medications">Current Medications</Label>
              <Textarea
                id="current_medications"
                value={formData.current_medications}
                onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                placeholder="List of current medications and dosages"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="physical_examination">Physical/Virtual Examination</Label>
              <Textarea
                id="physical_examination"
                value={formData.physical_examination}
                onChange={(e) => setFormData({ ...formData, physical_examination: e.target.value })}
                placeholder="Examination findings"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vital_signs_notes">Vital Signs Notes</Label>
              <Textarea
                id="vital_signs_notes"
                value={formData.vital_signs_notes}
                onChange={(e) => setFormData({ ...formData, vital_signs_notes: e.target.value })}
                placeholder="Additional notes about vitals"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment</Label>
              <Textarea
                id="assessment"
                value={formData.assessment}
                onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                placeholder="Clinical assessment"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Primary and secondary diagnoses"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment_plan">Treatment Plan</Label>
              <Textarea
                id="treatment_plan"
                value={formData.treatment_plan}
                onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
                placeholder="Recommended treatment approach"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescriptions_notes">Prescriptions Notes</Label>
              <Textarea
                id="prescriptions_notes"
                value={formData.prescriptions_notes}
                onChange={(e) => setFormData({ ...formData, prescriptions_notes: e.target.value })}
                placeholder="Notes about prescribed medications"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="follow_up_instructions">Follow-up Instructions</Label>
              <Textarea
                id="follow_up_instructions"
                value={formData.follow_up_instructions}
                onChange={(e) => setFormData({ ...formData, follow_up_instructions: e.target.value })}
                placeholder="When and why patient should return"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional_notes">Additional Notes</Label>
              <Textarea
                id="additional_notes"
                value={formData.additional_notes}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                placeholder="Any other relevant information"
                rows={3}
              />
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Consultation Notes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
