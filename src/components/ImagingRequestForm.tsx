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
  // CHEST AND ABDOMEN
  { id: "chest", label: "Chest", code: "3445", category: "Chest and Abdomen" },
  { id: "chest-ribs", label: "Chest and Ribs", code: "3449", category: "Chest and Abdomen" },
  { id: "abdomen", label: "Abdomen", code: "3477", category: "Chest and Abdomen" },
  { id: "acute-abdomen", label: "Acute Abdomen", code: "3479", category: "Chest and Abdomen" },
  { id: "thoracic-inlet", label: "Thoracic inlet", code: "0000", category: "Chest and Abdomen" },
  { id: "kub", label: "KUB", code: "0000", category: "Chest and Abdomen" },
  
  // UPPER EXTREMITIES
  { id: "finger", label: "Finger", code: "3305", category: "Upper Extremities" },
  { id: "hand", label: "Hand", code: "3305", category: "Upper Extremities" },
  { id: "wrist", label: "Wrist", code: "3305", category: "Upper Extremities" },
  { id: "forearm", label: "Forearm", code: "3367", category: "Upper Extremities" },
  { id: "elbow", label: "Elbow", code: "3907", category: "Upper Extremities" },
  { id: "humerus", label: "Humerus", code: "3907", category: "Upper Extremities" },
  { id: "shoulder", label: "Shoulder", code: "3907", category: "Upper Extremities" },
  { id: "clavicle", label: "Clavicle", code: "3907", category: "Upper Extremities" },
  { id: "scapula", label: "Scapula", code: "3907", category: "Upper Extremities" },
  
  // LOWER EXTREMITIES
  { id: "toe", label: "Toe", code: "3305", category: "Lower Extremities" },
  { id: "foot", label: "Foot", code: "3307", category: "Lower Extremities" },
  { id: "ankle", label: "Ankle", code: "3307", category: "Lower Extremities" },
  { id: "tibia-fibula", label: "Tibia & Fibula", code: "3307", category: "Lower Extremities" },
  { id: "knee", label: "Knee", code: "3307", category: "Lower Extremities" },
  { id: "femur", label: "Femur", code: "3307", category: "Lower Extremities" },
  { id: "hip", label: "Hip", code: "3307", category: "Lower Extremities" },
  { id: "pelvis", label: "Pelvis", code: "3331", category: "Lower Extremities" },
  { id: "sacroiliac", label: "Sacroiliac Joints", code: "3321", category: "Lower Extremities" },
  { id: "other-lower", label: "Other: Specify", code: "0000", category: "Lower Extremities" },
  
  // SPINE AND PELVIS
  { id: "cervical-spine", label: "Cervical Spine", code: "3321", category: "Spine and Pelvis" },
  { id: "thoracic-spine", label: "Thoracic Spine", code: "3321", category: "Spine and Pelvis" },
  { id: "lumbar-spine", label: "Lumbar Spine", code: "3321", category: "Spine and Pelvis" },
  { id: "sacrum", label: "Sacrum", code: "3321", category: "Spine and Pelvis" },
  { id: "coccyx", label: "Coccyx", code: "3321", category: "Spine and Pelvis" },
  { id: "whole-spine-pelvis", label: "Whole Spine & Pelvis", code: "3321", category: "Spine and Pelvis" },
  { id: "skeletal-survey", label: "Skeletal Survey", code: "3317", category: "Spine and Pelvis" },
  { id: "pelvis-spine", label: "Pelvis", code: "0000", category: "Spine and Pelvis" },
  { id: "hips", label: "Hips", code: "0000", category: "Spine and Pelvis" },
  { id: "skeletal-survey-under5", label: "Skeletal Survey <=5 years old", code: "0000", category: "Spine and Pelvis" },
  { id: "skeletal-survey-over5", label: "Skeletal Survey >5 years old", code: "0000", category: "Spine and Pelvis" },
  
  // HEAD AND NECK
  { id: "skull", label: "Skull", code: "3349", category: "Head and Neck" },
  { id: "sinuses", label: "Sinuses", code: "3351", category: "Head and Neck" },
  { id: "post-nasal", label: "Post Nasal", code: "3385", category: "Head and Neck" },
  { id: "mandible", label: "Mandible", code: "3355", category: "Head and Neck" },
  { id: "tmj", label: "TMJ", code: "3367", category: "Head and Neck" },
  { id: "facial-bones", label: "Facial Bones", code: "3353", category: "Head and Neck" },
  { id: "nasal-bone", label: "Nasal Bone", code: "3357", category: "Head and Neck" },
  { id: "mastoids", label: "Mastoids", code: "3359", category: "Head and Neck" },
  { id: "soft-tissue-neck", label: "Soft Tissue Neck", code: "3443", category: "Head and Neck" },
  { id: "thoracic-inlet-neck", label: "Thoracic Inlet", code: "3468", category: "Head and Neck" },
  { id: "sternum", label: "Sternum", code: "3451", category: "Head and Neck" },
  { id: "sternoclavicular", label: "Sternoclavicular Jt", code: "3451", category: "Head and Neck" },
  { id: "other-head", label: "Other: Specify", code: "0000", category: "Head and Neck" },
  
  // SPECIAL EXAMS
  { id: "barium-swallow", label: "Barium Swallow", code: "3399", category: "Special Exams" },
  { id: "barium-meal", label: "Barium Meal", code: "3403", category: "Special Exams" },
  { id: "barium-enema", label: "Barium Enema", code: "3409", category: "Special Exams" },
  { id: "ivu", label: "IVU", code: "3487", category: "Special Exams" },
  { id: "urethrogram", label: "Urethrogram", code: "3499", category: "Special Exams" },
  { id: "cystogram", label: "Cystogram", code: "3497", category: "Special Exams" },
  { id: "ocg", label: "OCG", code: "3425", category: "Special Exams" },
  { id: "hsg", label: "HSG", code: "3519", category: "Special Exams" },
  { id: "sialogram", label: "Sialogram", code: "3695", category: "Special Exams" },
  { id: "sinogram", label: "Sinogram", code: "3603", category: "Special Exams" },
  { id: "venogram", label: "Venogram", code: "3345", category: "Special Exams" },
];

const ULTRASOUND_REGIONS = [
  { id: "us-abdomen", label: "Abdomen", code: "3627", category: "Ultrasound" },
  { id: "us-renal", label: "Renal Tract", code: "3628", category: "Ultrasound" },
  { id: "us-pelvis-ta", label: "Pelvis Transabdominal", code: "3618", category: "Ultrasound" },
  { id: "us-pelvis-tv", label: "Pelvis Organs: Transvaginal", code: "5100", category: "Ultrasound" },
  { id: "us-soft-tissue", label: "Soft Tissue", code: "3629", category: "Ultrasound" },
  { id: "us-obstetric", label: "Obstetric", code: "3615", category: "Ultrasound" },
  { id: "us-obstetric-fu", label: "Obstetric F/UP", code: "3617", category: "Ultrasound" },
  { id: "us-thyroid", label: "Thyroid", code: "3629", category: "Ultrasound" },
  { id: "us-scrotum", label: "Scrotum", code: "3629", category: "Ultrasound" },
  { id: "us-breast", label: "Breast", code: "3629", category: "Ultrasound" },
  { id: "us-prostate-ta", label: "Prostate Transabdominal", code: "3629", category: "Ultrasound" },
  { id: "us-thyroid-neck", label: "Thyroid / Neck", code: "0000", category: "Ultrasound" },
  { id: "us-soft-tissue-region", label: "Ultrasound Soft Tissue any Region", code: "0000", category: "Ultrasound" },
  { id: "us-neonatal-head", label: "Neonatal Head Scan", code: "0000", category: "Ultrasound" },
  { id: "us-pleural", label: "Pleural Space Ultrasound", code: "0000", category: "Ultrasound" },
  { id: "us-venous", label: "Peripheral Venous Ultrasound Study", code: "0000", category: "Ultrasound" },
  { id: "us-arterial", label: "Peripheral Arterial Ultrasound Vascular Study (GHP)", code: "0000", category: "Ultrasound" },
  { id: "us-carotid", label: "Carotid Ultrasound Vascular Study", code: "0000", category: "Ultrasound" },
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
          code: region?.code || "0000",
          category: region?.category || "",
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

      const { data: newRequest, error } = await supabase
        .from("diagnostic_requests")
        .insert(requestData)
        .select()
        .single();

      if (error) throw error;

      toast.success(`${imagingType === "xray" ? "X-Ray" : "Ultrasound"} request created successfully`);

      // Generate PDF for the request
      try {
        const { error: pdfError } = await supabase.functions.invoke(
          "generate-imaging-request-pdf",
          {
            body: { requestId: newRequest.id },
          }
        );

        if (pdfError) {
          console.error("Error generating PDF:", pdfError);
          toast.error("Request created but PDF generation failed");
        } else {
          toast.success("PDF generated successfully");
        }
      } catch (pdfError) {
        console.error("Error generating PDF:", pdfError);
        toast.error("Request created but PDF generation failed");
      }

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
            <div className="max-h-96 overflow-y-auto border rounded-md p-4">
              {imagingType === "xray" ? (
                <>
                  {["Chest and Abdomen", "Upper Extremities", "Lower Extremities", "Spine and Pelvis", "Head and Neck", "Special Exams"].map((category) => (
                    <div key={category} className="mb-4">
                      <h4 className="font-semibold text-sm mb-2 text-primary">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                        {currentRegions
                          .filter((r) => r.category === category)
                          .map((region) => (
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
                                {region.label} <span className="text-muted-foreground">({region.code})</span>
                              </label>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                        {region.label} <span className="text-muted-foreground">({region.code})</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
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
