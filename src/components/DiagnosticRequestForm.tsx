import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText } from "lucide-react";

interface DiagnosticRequestFormProps {
  visitId: string;
  patientId: string;
  patientName: string;
  canCreate: boolean;
}

const COMMON_TESTS = [
  { id: "fbc", label: "Full Blood Count (FBC)" },
  { id: "ue", label: "Urea & Electrolytes (U&E)" },
  { id: "lft", label: "Liver Function Test (LFT)" },
  { id: "glucose", label: "Glucose (Random/Fasting)" },
  { id: "hba1c", label: "HbA1c" },
  { id: "lipogram", label: "Lipogram" },
  { id: "tft", label: "Thyroid Function Test (TFT)" },
  { id: "crp", label: "C-Reactive Protein (CRP)" },
  { id: "esr", label: "ESR" },
  { id: "urine", label: "Urinalysis" },
  { id: "xray_chest", label: "X-Ray: Chest" },
  { id: "xray_other", label: "X-Ray: Other" },
  { id: "ecg", label: "ECG" },
  { id: "ultrasound", label: "Ultrasound" },
  { id: "other", label: "Other (specify in notes)" },
];

export function DiagnosticRequestForm({
  visitId,
  patientId,
  patientName,
  canCreate,
}: DiagnosticRequestFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTestToggle = (testId: string) => {
    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSubmit = async () => {
    if (selectedTests.length === 0) {
      toast.error("Please select at least one test");
      return;
    }

    setIsSubmitting(true);
    try {
      const testsRequested = selectedTests.map((testId) => {
        const test = COMMON_TESTS.find((t) => t.id === testId);
        return { id: testId, label: test?.label || testId };
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("diagnostic_requests").insert({
        visit_id: visitId,
        patient_id: patientId,
        requested_by: user?.id || "",
        tests_requested: testsRequested,
        clinical_notes: clinicalNotes,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Diagnostic request created successfully");
      setIsOpen(false);
      setSelectedTests([]);
      setClinicalNotes("");
      
      // Refresh the page to show the new request
      window.location.reload();
    } catch (error) {
      console.error("Error creating diagnostic request:", error);
      toast.error("Failed to create diagnostic request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Request Diagnostic Tests
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Diagnostic Tests</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Patient: <span className="font-medium text-foreground">{patientName}</span>
            </p>
          </div>

          <div className="space-y-4">
            <Label>Select Tests Required</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMMON_TESTS.map((test) => (
                <div key={test.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={test.id}
                    checked={selectedTests.includes(test.id)}
                    onCheckedChange={() => handleTestToggle(test.id)}
                  />
                  <label
                    htmlFor={test.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {test.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinical-notes">Clinical Notes / Indication for Tests</Label>
            <Textarea
              id="clinical-notes"
              placeholder="Enter clinical indication for the requested tests..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
