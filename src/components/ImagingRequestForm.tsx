import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ImagingRequestFormProps {
  visitId: string;
  patientId: string;
  patientName: string;
  canCreate: boolean;
}

const XRAY_REGIONS = [
  { id: "chest", label: "Chest (PA/Lateral)" },
  { id: "abdomen", label: "Abdomen" },
  { id: "pelvis", label: "Pelvis" },
  { id: "spine_cervical", label: "Spine - Cervical" },
  { id: "spine_thoracic", label: "Spine - Thoracic" },
  { id: "spine_lumbar", label: "Spine - Lumbar" },
  { id: "skull", label: "Skull" },
  { id: "shoulder_left", label: "Shoulder - Left" },
  { id: "shoulder_right", label: "Shoulder - Right" },
  { id: "elbow_left", label: "Elbow - Left" },
  { id: "elbow_right", label: "Elbow - Right" },
  { id: "wrist_left", label: "Wrist - Left" },
  { id: "wrist_right", label: "Wrist - Right" },
  { id: "hand_left", label: "Hand - Left" },
  { id: "hand_right", label: "Hand - Right" },
  { id: "hip_left", label: "Hip - Left" },
  { id: "hip_right", label: "Hip - Right" },
  { id: "knee_left", label: "Knee - Left" },
  { id: "knee_right", label: "Knee - Right" },
  { id: "ankle_left", label: "Ankle - Left" },
  { id: "ankle_right", label: "Ankle - Right" },
  { id: "foot_left", label: "Foot - Left" },
  { id: "foot_right", label: "Foot - Right" },
];

const ULTRASOUND_REGIONS = [
  { id: "abdomen", label: "Abdomen (General)" },
  { id: "pelvis", label: "Pelvis" },
  { id: "obstetric", label: "Obstetric" },
  { id: "renal", label: "Renal (Kidneys)" },
  { id: "hepatobiliary", label: "Hepatobiliary (Liver/Gallbladder)" },
  { id: "thyroid", label: "Thyroid" },
  { id: "breast", label: "Breast" },
  { id: "soft_tissue", label: "Soft Tissue" },
  { id: "vascular", label: "Vascular/Doppler" },
];

export function ImagingRequestForm({
  visitId,
  patientId,
  patientName,
  canCreate,
}: ImagingRequestFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imagingType, setImagingType] = useState<"xray" | "ultrasound">("xray");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [clinicalHistory, setClinicalHistory] = useState("");
  const [clinicalIndication, setClinicalIndication] = useState("");
  const [relevantFindings, setRelevantFindings] = useState("");
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("");
  const [pregnancy, setPregnancy] = useState<string>("no");
  const [pregnancyWeeks, setPregnancyWeeks] = useState("");
  const [contrast, setContrast] = useState<string>("no");
  const [allergies, setAllergies] = useState("");
  const [urgency, setUrgency] = useState<string>("routine");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegionToggle = (regionId: string) => {
    setSelectedRegions((prev) =>
      prev.includes(regionId)
        ? prev.filter((id) => id !== regionId)
        : [...prev, regionId]
    );
  };

  const handleSubmit = async () => {
    if (selectedRegions.length === 0) {
      toast.error("Please select at least one region");
      return;
    }

    if (!clinicalIndication.trim()) {
      toast.error("Please provide clinical indication");
      return;
    }

    setIsSubmitting(true);
    try {
      const regions = imagingType === "xray" ? XRAY_REGIONS : ULTRASOUND_REGIONS;
      const testsRequested = selectedRegions.map((regionId) => {
        const region = regions.find((r) => r.id === regionId);
        return { 
          id: regionId, 
          label: region?.label || regionId,
          type: imagingType 
        };
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      const requestData = {
        visit_id: visitId,
        patient_id: patientId,
        requested_by: user?.id || "",
        tests_requested: testsRequested,
        clinical_notes: JSON.stringify({
          imagingType,
          clinicalHistory,
          clinicalIndication,
          relevantFindings,
          provisionalDiagnosis,
          pregnancy: pregnancy === "yes" ? { status: true, weeks: pregnancyWeeks } : { status: false },
          contrast: contrast === "yes",
          allergies,
          urgency,
        }),
        status: "pending",
      };

      const { error } = await supabase.from("diagnostic_requests").insert(requestData);

      if (error) throw error;

      toast.success(`${imagingType === "xray" ? "X-Ray" : "Ultrasound"} request created successfully`);
      setIsOpen(false);
      resetForm();
      
      window.location.reload();
    } catch (error) {
      console.error("Error creating imaging request:", error);
      toast.error("Failed to create imaging request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedRegions([]);
    setClinicalHistory("");
    setClinicalIndication("");
    setRelevantFindings("");
    setProvisionalDiagnosis("");
    setPregnancy("no");
    setPregnancyWeeks("");
    setContrast("no");
    setAllergies("");
    setUrgency("routine");
  };

  if (!canCreate) return null;

  const currentRegions = imagingType === "xray" ? XRAY_REGIONS : ULTRASOUND_REGIONS;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Camera className="h-4 w-4 mr-2" />
          Request X-Ray / Ultrasound
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Imaging Request Form</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Patient: <span className="font-medium text-foreground">{patientName}</span>
              </p>
            </CardContent>
          </Card>

          {/* Imaging Type Selection */}
          <div className="space-y-3">
            <Label>Examination Type *</Label>
            <RadioGroup value={imagingType} onValueChange={(value: "xray" | "ultrasound") => {
              setImagingType(value);
              setSelectedRegions([]);
            }}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xray" id="xray" />
                <label htmlFor="xray" className="text-sm font-medium cursor-pointer">
                  X-Ray
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ultrasound" id="ultrasound" />
                <label htmlFor="ultrasound" className="text-sm font-medium cursor-pointer">
                  Ultrasound
                </label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Region Selection */}
          <div className="space-y-3">
            <Label>Region(s) to be Examined *</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
              {currentRegions.map((region) => (
                <div key={region.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={region.id}
                    checked={selectedRegions.includes(region.id)}
                    onCheckedChange={() => handleRegionToggle(region.id)}
                  />
                  <label
                    htmlFor={region.id}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {region.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Clinical Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Clinical Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="clinical-history">Brief Clinical History</Label>
              <Textarea
                id="clinical-history"
                placeholder="Patient's relevant medical history..."
                value={clinicalHistory}
                onChange={(e) => setClinicalHistory(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinical-indication">Clinical Indication / Reason for Examination *</Label>
              <Textarea
                id="clinical-indication"
                placeholder="E.g., ?Fracture, ?Pneumonia, Follow-up..."
                value={clinicalIndication}
                onChange={(e) => setClinicalIndication(e.target.value)}
                rows={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relevant-findings">Relevant Clinical Findings</Label>
              <Textarea
                id="relevant-findings"
                placeholder="Physical examination findings..."
                value={relevantFindings}
                onChange={(e) => setRelevantFindings(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provisional-diagnosis">Provisional Diagnosis</Label>
              <Input
                id="provisional-diagnosis"
                placeholder="Suspected condition..."
                value={provisionalDiagnosis}
                onChange={(e) => setProvisionalDiagnosis(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Pregnancy Status (if applicable)</Label>
              <RadioGroup value={pregnancy} onValueChange={setPregnancy}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="not-pregnant" />
                  <label htmlFor="not-pregnant" className="text-sm cursor-pointer">
                    Not Pregnant / N/A
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="pregnant" />
                  <label htmlFor="pregnant" className="text-sm cursor-pointer">
                    Pregnant
                  </label>
                </div>
              </RadioGroup>
              {pregnancy === "yes" && (
                <Input
                  placeholder="Weeks gestation"
                  value={pregnancyWeeks}
                  onChange={(e) => setPregnancyWeeks(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-3">
              <Label>Contrast Required</Label>
              <RadioGroup value={contrast} onValueChange={setContrast}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no-contrast" />
                  <label htmlFor="no-contrast" className="text-sm cursor-pointer">
                    No
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes-contrast" />
                  <label htmlFor="yes-contrast" className="text-sm cursor-pointer">
                    Yes
                  </label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Known Allergies</Label>
              <Input
                id="allergies"
                placeholder="List any known allergies..."
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>Urgency</Label>
              <RadioGroup value={urgency} onValueChange={setUrgency}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="routine" id="routine" />
                  <label htmlFor="routine" className="text-sm cursor-pointer">
                    Routine
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <label htmlFor="urgent" className="text-sm cursor-pointer">
                    Urgent (within 24h)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emergency" id="emergency" />
                  <label htmlFor="emergency" className="text-sm cursor-pointer">
                    Emergency (immediate)
                  </label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating Request..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
